import { parseFragment } from "parse5";
import {
  COLOUR_VARS, DATA_ATTRS, DISPLAY_VALUES, FONTS, GENERIC_FONTS, LIMITS, MAX_LINES, MAX_SIZE, MIN_SIZE, OVERFLOW_VALUES, POSITION_VALUES, REQUIRED_SLOTS, SLOTS, SLOT_NAMES, SLOT_TOKEN,
  STYLE_FUNCTIONS, STYLE_PROPS, SVG_ATTRS, SVG_TAGS, TAGS, TEMPLATE_SIZE, CONTRACT_VERSION, isImageSlot, isSlot, isTextSlot, type SlotName,
} from "./contract";

/**
 * Turns pasted HTML into a template tree, or a list of plain-words errors.
 * The input is untrusted. This is an allow-list parser: every tag, attribute,
 * style property and value must be listed in contract.ts, and anything else is
 * an error. Nothing is "cleaned" and kept; a template that does not match the
 * contract is refused whole, so what we saved is exactly what we checked. The
 * output holds plain data only (no HTML strings), and the renderer hands text
 * to Satori as text, never as markup.
 */

export interface FitSpec {
  slot: SlotName;
  maxLines: number;
  min: number;
  max: number;
  emphasisColour?: (typeof COLOUR_VARS)[number];
  emphasisFont?: string;
}

export interface TNode {
  tag: string;
  svg: boolean;
  style: Record<string, string | number>;
  attrs: Record<string, string>;
  /** <img src="{{photo}}">: which image slot fills it. */
  imageSlot?: SlotName;
  /** <img src="data:image/...">: a small inline picture. */
  dataSrc?: string;
  fit?: FitSpec;
  /** Removed from the cover when this optional slot is empty. */
  ifSlot?: SlotName;
  children: TChild[];
}
export type TChild = TNode | { text: string };

export interface Template {
  version: number;
  name: string;
  root: TNode;
  slots: SlotName[];
}

export type ParseResult = { ok: true; template: Template } | { ok: false; errors: string[] };

const MAX_ERRORS = 12;
const CANON: Record<string, string> = { lineargradient: "linearGradient", radialgradient: "radialGradient" };
const NUMERIC_PROPS = new Set(["fontWeight", "lineHeight", "opacity", "flexGrow", "flexShrink", "flex"]);
const PX = /^-?\d+(\.\d+)?px$/;
const INT = /^\d{1,4}$/;
const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const URL_DATA = /url\(\s*(data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})\s*\)/g;

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

interface Ctx {
  errors: string[];
  nodes: number;
  imageBytes: number;
  used: Map<SlotName, number>;
}
const err = (ctx: Ctx, msg: string) => {
  if (ctx.errors.length < MAX_ERRORS && !ctx.errors.includes(msg)) ctx.errors.push(msg);
};

interface P5Node {
  nodeName: string;
  tagName?: string;
  value?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: P5Node[];
  namespaceURI?: string;
}

export function parseTemplate(source: unknown): ParseResult {
  if (typeof source !== "string") return { ok: false, errors: ["Paste the template as text."] };
  const bytes = Buffer.byteLength(source);
  if (bytes > LIMITS.sourceBytes) return { ok: false, errors: [`The template is ${Math.round(bytes / 1024)} KB; the limit is ${LIMITS.sourceBytes / 1024} KB.`] };
  if (!source.trim()) return { ok: false, errors: ["Paste the template first."] };
  if (source.includes("\u0000")) return { ok: false, errors: ["The template holds an invalid character."] };

  const ctx: Ctx = { errors: [], nodes: 0, imageBytes: 0, used: new Map() };
  const syntax: string[] = [];
  const fragment = parseFragment(source, { onParseError: (e) => syntax.push(e.code) }) as unknown as P5Node;
  if (syntax.length) {
    return { ok: false, errors: [`The HTML is malformed (${[...new Set(syntax)].slice(0, 3).join(", ")}). Close every tag and write attributes as name="value".`] };
  }

  const top = (fragment.childNodes ?? []).filter((n) => n.nodeName !== "#comment" && !(n.nodeName === "#text" && !n.value?.trim()));
  if (top.length !== 1 || top[0].nodeName === "#text") return { ok: false, errors: ["The template must be one root <div> and nothing else."] };
  const rootEl = top[0];
  if (rootEl.tagName !== "div") return { ok: false, errors: [`The root must be a <div>, not <${rootEl.tagName}>.`] };

  const rootAttrs = new Map((rootEl.attrs ?? []).map((a) => [a.name.toLowerCase(), a.value]));
  const name = (rootAttrs.get("data-name") ?? "").trim();
  if (rootAttrs.get("data-cover-template") !== String(CONTRACT_VERSION)) err(ctx, `The root <div> needs data-cover-template="${CONTRACT_VERSION}".`);
  if (!name) err(ctx, 'The root <div> needs data-name="a short name".');
  else if (name.length > LIMITS.nameChars || /[<>{}]/.test(name)) err(ctx, `data-name must be at most ${LIMITS.nameChars} characters, plain text.`);

  const root = walk(rootEl, ctx, 1, new Set(), true);

  if (root) {
    const w = root.style.width;
    const h = root.style.height;
    if (w !== `${TEMPLATE_SIZE.width}px` || h !== `${TEMPLATE_SIZE.height}px`) err(ctx, `The root must be exactly ${TEMPLATE_SIZE.width}px wide and ${TEMPLATE_SIZE.height}px high.`);
  }
  for (const s of REQUIRED_SLOTS) if (!ctx.used.get(s)) err(ctx, `The template never uses {{${s}}}; it is required.`);
  if ((ctx.used.get("headline") ?? 0) > 1) err(ctx, "{{headline}} may appear only once.");
  if (ctx.imageBytes > LIMITS.inlineImageBytes) err(ctx, `Inline images total ${Math.round(ctx.imageBytes / 1024)} KB; the limit is ${LIMITS.inlineImageBytes / 1024} KB.`);
  if (ctx.nodes > LIMITS.nodes) err(ctx, `The template has more than ${LIMITS.nodes} elements.`);

  if (ctx.errors.length || !root) return { ok: false, errors: ctx.errors.length ? ctx.errors : ["The template could not be read."] };
  return { ok: true, template: { version: CONTRACT_VERSION, name, root, slots: SLOT_NAMES.filter((s) => ctx.used.has(s)) } };
}

function describe(el: P5Node): string {
  return `<${(el.tagName ?? "?").toLowerCase()}>`;
}

function walk(el: P5Node, ctx: Ctx, depth: number, ifs: Set<SlotName>, isRoot = false): TNode | null {
  const tag = (el.tagName ?? "").toLowerCase();
  if (!TAGS.has(tag)) {
    err(ctx, `<${tag}> is not allowed. Allowed tags: ${[...TAGS].map((t) => CANON[t] ?? t).join(", ")}.`);
    return null;
  }
  if (++ctx.nodes > LIMITS.nodes) return null;
  if (depth > LIMITS.depth) {
    err(ctx, `Elements are nested more than ${LIMITS.depth} deep.`);
    return null;
  }
  const svg = SVG_TAGS.has(tag);
  const node: TNode = { tag: CANON[tag] ?? tag, svg, style: {}, attrs: {}, children: [] };
  const here = describe(el);

  for (const a of el.attrs ?? []) {
    const n = a.name.toLowerCase();
    const v = a.value;
    if (n === "style") {
      if (svg && tag !== "svg") err(ctx, `${here} cannot carry style="".`);
      else node.style = parseStyle(v, ctx, here);
    } else if (n.startsWith("data-")) {
      if (!DATA_ATTRS.has(n)) err(ctx, `${here} has ${n}, which the contract does not know.`);
      else if (!isRoot && (n === "data-cover-template" || n === "data-name")) err(ctx, `${n} belongs on the root <div> only.`);
    } else if (tag === "img" && n === "src") {
      imageSrc(node, v, ctx, here);
    } else if (tag === "img" && (n === "width" || n === "height")) {
      if (!INT.test(v) || Number(v) < 1 || Number(v) > 2000) err(ctx, `<img> ${n} must be a whole number of pixels, 1 to 2000.`);
      else node.attrs[n] = v;
    } else if (tag === "img" && n === "alt") {
      // Decorative text for browsers; Satori ignores it, so it is dropped.
    } else if (svg && SVG_ATTRS.has(n)) {
      if (n !== "xmlns") svgAttr(node, n, v, ctx, here);
    } else {
      err(ctx, `${here} has the attribute ${n}, which is not allowed${n === "class" ? ' (use style="" instead)' : n === "id" ? " (id is for SVG gradients only)" : ""}.`);
    }
    if (n !== "src" && SLOT_TOKEN.test(v) && !n.startsWith("data-")) err(ctx, `Slots work only as element text or an <img src>, not inside ${n}.`);
    SLOT_TOKEN.lastIndex = 0;
  }

  const ifName = (el.attrs ?? []).find((a) => a.name.toLowerCase() === "data-if")?.value.trim();
  if (ifName !== undefined) {
    if (!isSlot(ifName) || SLOTS[ifName].required || SLOTS[ifName].kind === "word") err(ctx, `data-if="${ifName}" must name an optional slot (${SLOT_NAMES.filter((s) => !SLOTS[s].required && SLOTS[s].kind !== "word").join(", ")}).`);
    else {
      node.ifSlot = ifName;
      ifs = new Set([...ifs, ifName]);
    }
  }

  if (tag === "img") {
    if (!node.imageSlot && !node.dataSrc) err(ctx, '<img> needs src="{{photo}}", src="{{cutout}}" or a small inline data: image.');
    if (!node.attrs.width || !node.attrs.height) err(ctx, '<img> needs width="" and height="" in pixels.');
    if (node.imageSlot && !ifs.has(node.imageSlot)) err(ctx, `{{${node.imageSlot}}} is optional: wrap the <img> in an element with data-if="${node.imageSlot}".`);
    if (node.imageSlot) ctx.used.set(node.imageSlot, (ctx.used.get(node.imageSlot) ?? 0) + 1);
    if ((el.childNodes ?? []).length) err(ctx, "<img> cannot hold anything.");
    return node;
  }

  const kids = (el.childNodes ?? []).filter((c) => c.nodeName !== "#comment");
  const dataAttr = (n: string) => (el.attrs ?? []).find((a) => a.name.toLowerCase() === n)?.value;
  const hasFit = (el.attrs ?? []).some((a) => a.name.toLowerCase() === "data-fit");

  if (hasFit) {
    if (svg) err(ctx, "data-fit cannot sit on an SVG element.");
    else fitNode(el, node, kids, ctx, here, ifs, dataAttr);
    return node;
  }
  for (const n of ["data-max-lines", "data-min-size", "data-max-size", "data-emphasis-color", "data-emphasis-font"]) if (dataAttr(n) !== undefined) err(ctx, `${n} belongs only on a data-fit element.`);

  for (const c of kids) {
    if (c.nodeName === "#text") {
      const text = (c.value ?? "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (svg) err(ctx, "SVG shapes cannot hold text.");
      else if (/\{\{|\}\}/.test(text)) err(ctx, `A slot must sit alone inside its own element with data-fit; it cannot share ${here} with other text.`);
      else if (text.length > LIMITS.textChars) err(ctx, `${here} holds more than ${LIMITS.textChars} characters of fixed text.`);
      else node.children.push({ text });
    } else {
      if (tag === "svg" && !SVG_TAGS.has((c.tagName ?? "").toLowerCase())) err(ctx, `<${(c.tagName ?? "").toLowerCase()}> cannot sit inside <svg>.`);
      if (svg && !SVG_TAGS.has((c.tagName ?? "").toLowerCase())) continue;
      const child = walk(c, ctx, depth + 1, ifs);
      if (child) node.children.push(child);
    }
  }
  return node;
}

function fitNode(el: P5Node, node: TNode, kids: P5Node[], ctx: Ctx, here: string, ifs: Set<SlotName>, dataAttr: (n: string) => string | undefined) {
  const content = kids.filter((c) => !(c.nodeName === "#text" && !c.value?.trim()));
  const m = content.length === 1 && content[0].nodeName === "#text" ? /^\s*\{\{\s*([a-z0-9_]+)\s*\}\}\s*$/.exec(content[0].value ?? "") : null;
  if (!m) {
    err(ctx, `A data-fit element must hold exactly one slot and nothing else, like <div data-fit ...>{{headline}}</div> (${here}).`);
    return;
  }
  const slot = m[1];
  if (!isSlot(slot)) {
    err(ctx, `{{${slot}}} is not a slot. Slots: ${SLOT_NAMES.map((s) => `{{${s}}}`).join(" ")}.`);
    return;
  }
  if (SLOTS[slot].kind === "word") {
    err(ctx, `{{${slot}}} is not placed on the cover; set data-emphasis-color on the headline element to highlight the word.`);
    return;
  }
  if (!isTextSlot(slot)) {
    err(ctx, `{{${slot}}} is a picture: use <img src="{{${slot}}}"> instead.`);
    return;
  }
  ctx.used.set(slot, (ctx.used.get(slot) ?? 0) + 1);
  if (!SLOTS[slot].required && !ifs.has(slot)) err(ctx, `{{${slot}}} is optional: wrap its element in data-if="${slot}".`);

  const num = (n: string, lo: number, hi: number): number | null => {
    const v = dataAttr(n);
    if (v === undefined || !INT.test(v) || Number(v) < lo || Number(v) > hi) {
      err(ctx, `${n} must be a whole number from ${lo} to ${hi} on the element holding {{${slot}}}.`);
      return null;
    }
    return Number(v);
  };
  const floor = slot === "headline" ? MIN_SIZE.headline : MIN_SIZE.other;
  const maxLines = num("data-max-lines", 1, MAX_LINES);
  const min = num("data-min-size", floor, MAX_SIZE);
  const max = num("data-max-size", floor, MAX_SIZE);
  if (min !== null && max !== null && min > max) err(ctx, `data-min-size is bigger than data-max-size on {{${slot}}}.`);
  if (min !== null && min < floor) err(ctx, `{{${slot}}} may not shrink below ${floor}px: a phone feed shows the cover at a third of its size.`);

  const s = node.style;
  if (typeof s.width !== "string" || !PX.test(s.width)) err(ctx, `The element holding {{${slot}}} needs a width in px (style="width:900px").`);
  if (Object.keys(s).some((k) => /^(padding|border)/.test(k))) err(ctx, `The element holding {{${slot}}} cannot have padding or a border: put them on a wrapper.`);
  if (s.letterSpacing !== undefined || s.textTransform !== undefined) err(ctx, `The element holding {{${slot}}} cannot use letter-spacing or text-transform: fitting measures the text as written.`);
  if (typeof s.fontFamily !== "string") err(ctx, `The element holding {{${slot}}} needs a font-family (${FONTS.join(", ")}).`);
  if (s.lineHeight !== undefined && (typeof s.lineHeight !== "number" || s.lineHeight < 0.8 || s.lineHeight > 2)) err(ctx, `line-height on {{${slot}}} must be a plain number from 0.8 to 2.`);

  const ec = dataAttr("data-emphasis-color");
  const ef = dataAttr("data-emphasis-font");
  if ((ec !== undefined || ef !== undefined) && slot !== "headline") err(ctx, "data-emphasis-color and data-emphasis-font belong on the {{headline}} element only.");
  if (ec !== undefined && !(COLOUR_VARS as readonly string[]).includes(ec)) err(ctx, `data-emphasis-color must be one of ${COLOUR_VARS.join(", ")}.`);
  if (ef !== undefined && !(FONTS as readonly string[]).includes(ef)) err(ctx, `data-emphasis-font must be one of ${FONTS.join(", ")}.`);

  if (maxLines !== null && min !== null && max !== null) {
    node.fit = { slot, maxLines, min, max, emphasisColour: ec as FitSpec["emphasisColour"], emphasisFont: ef };
  }
}

function imageSrc(node: TNode, v: string, ctx: Ctx, here: string) {
  const slot = /^\s*\{\{\s*([a-z0-9_]+)\s*\}\}\s*$/.exec(v)?.[1];
  if (slot) {
    if (!isSlot(slot) || !isImageSlot(slot)) err(ctx, `{{${slot}}} is not a picture slot. Picture slots: {{photo}} {{cutout}}.`);
    else node.imageSlot = slot;
    return;
  }
  const m = DATA_IMAGE.exec(v.trim());
  if (!m) {
    err(ctx, `${here} src must be {{photo}}, {{cutout}} or a data:image/png, jpeg or webp inline picture. Web addresses are not allowed.`);
    return;
  }
  ctx.imageBytes += Math.floor((m[2].length * 3) / 4);
  node.dataSrc = v.trim();
}

const SVG_URL = /^url\(#[A-Za-z0-9_-]{1,40}\)$/;
function svgAttr(node: TNode, n: string, v: string, ctx: Ctx, here: string) {
  if (v.length > 4000 || /[<>{}\\@]|javascript|expression/i.test(v)) {
    err(ctx, `${here} has an unsafe or oversized ${n}.`);
    return;
  }
  if (/url\s*\(/i.test(v) && !SVG_URL.test(v.trim())) {
    err(ctx, `${here} ${n} may only point at a gradient in the same SVG, like url(#g1).`);
    return;
  }
  if (/[a-z-]+\s*\(/i.test(v.replace(SVG_URL, "")) && !/^(translate|rotate|scale|skewX|skewY|matrix)\b/i.test(v.trim()) && n !== "fill" && n !== "stroke" && n !== "stop-color") {
    err(ctx, `${here} ${n} holds a function the contract does not allow.`);
    return;
  }
  for (const m of v.matchAll(/var\(([^)]*)\)/gi)) {
    if (!(COLOUR_VARS as readonly string[]).some((c) => m[1].trim() === `--${c}`)) {
      err(ctx, `${here} ${n}: var(${m[1].trim()}) is not available; use var(--ink), var(--paper), var(--accent) or var(--secondary).`);
      return;
    }
  }
  const key = n === "viewbox" ? "viewBox" : camel(n).replace("gradientunits", "gradientUnits").replace("gradienttransform", "gradientTransform");
  node.attrs[key] = v;
}

/** Splits "a:b;c:url(data:x;base64,y)" into declarations, keeping ; inside () and quotes together. */
function declarations(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let cur = "";
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === ";" && depth === 0) {
      if (cur.trim()) out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function parseStyle(text: string, ctx: Ctx, here: string): Record<string, string | number> {
  const style: Record<string, string | number> = {};
  // Inline background pictures have their own byte budget; the rest of the style is capped here.
  if (text.replace(URL_DATA, "x").length > LIMITS.styleChars) err(ctx, `${here} style is longer than ${LIMITS.styleChars} characters.`);
  for (const d of declarations(text)) {
    const i = d.indexOf(":");
    if (i < 1) {
      err(ctx, `${here} has a style piece without a name: "${d.trim().slice(0, 40)}".`);
      continue;
    }
    const prop = d.slice(0, i).trim().toLowerCase();
    const value = d.slice(i + 1).trim();
    if (!STYLE_PROPS.has(prop)) {
      err(ctx, `${here} uses the style property "${prop}", which is not allowed.`);
      continue;
    }
    const bad = badValue(prop, value, ctx);
    if (bad) {
      err(ctx, `${here} ${prop}: ${bad}`);
      continue;
    }
    const key = camel(prop);
    style[key] = NUMERIC_PROPS.has(key) && /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }
  return style;
}

/** Why a style value is refused, or null when it is fine. */
function badValue(prop: string, value: string, ctx: Ctx): string | null {
  if (!value) return "is empty.";
  // Inline pictures are checked on their own, then taken out so the rest is held to the strict rules.
  let rest = value;
  if (/url\s*\(/i.test(value)) {
    if (prop !== "background-image" && prop !== "background") return "url() is only allowed in background-image, with an inline data: picture.";
    URL_DATA.lastIndex = 0;
    rest = value.replace(URL_DATA, (_m, data: string) => {
      const b64 = data.split(",")[1] ?? "";
      ctx.imageBytes += Math.floor((b64.length * 3) / 4);
      return "x";
    });
    if (/url\s*\(/i.test(rest)) return "url() may only hold an inline data:image/png, jpeg or webp picture, never a web address.";
  }
  if (rest.length > LIMITS.valueChars) return `is longer than ${LIMITS.valueChars} characters.`;
  if (/[\\<>{}@!]|\/\*|expression|javascript|vbscript|behaviou?r|binding|import/i.test(rest)) return "holds characters or words that are not allowed.";
  if (prop !== "font-family" && /["']/.test(rest)) return "may not hold quotes.";
  for (const m of rest.matchAll(/([a-z-]+)\s*\(/gi)) {
    const fn = m[1].toLowerCase();
    if (!STYLE_FUNCTIONS.has(fn)) return `${fn}() is not allowed (calc and friends are not supported).`;
  }
  for (const m of rest.matchAll(/var\(([^)]*)\)/gi)) {
    const name = m[1].trim();
    if (!(COLOUR_VARS as readonly string[]).some((c) => name === `--${c}`)) return `var(${name}) is not available; use var(--ink), var(--paper), var(--accent) or var(--secondary).`;
  }
  if (!/^[a-zA-Z0-9#%.,()\s+\-/'"]*$/.test(rest)) return "holds characters that are not allowed.";
  if (prop === "display" && !DISPLAY_VALUES.has(value)) return `must be flex (Satori draws flexbox only), not ${value}.`;
  if (prop === "position" && !POSITION_VALUES.has(value)) return "must be relative or absolute.";
  if (prop === "overflow" && !OVERFLOW_VALUES.has(value)) return "must be hidden or visible.";
  if (prop === "font-family") {
    const fams = value.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""));
    const bad = fams.find((f) => !(FONTS as readonly string[]).includes(f) && !GENERIC_FONTS.includes(f));
    if (bad) return `"${bad}" is not available. Use ${FONTS.join(", ")}.`;
  }
  return null;
}
