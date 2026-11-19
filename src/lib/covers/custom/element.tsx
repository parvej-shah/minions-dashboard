import { createElement, type ReactNode } from "react";
import { balance, fit, type Fitted } from "../fit";
import { COVER_FONTS, COVER_FONT_IDS, faceStyle, type Face } from "../fonts";
import { CoverFitError, type CoverBrand } from "../layouts";
import { COLOUR_VARS, SLOTS, type SlotName } from "./contract";
import type { FitSpec, TChild, TNode, Template } from "./parse";

/**
 * Draws a parsed template (parse.ts) for one post. The template tree holds
 * only validated plain data; every value is handed to Satori as text or as an
 * image source we supplied, never as markup. Text is fitted here with the same
 * font metrics the built-in designs use, because Satori cannot shrink text.
 */

export type TemplateValues = Partial<Record<SlotName, string>>;

const px = (v: unknown) => (typeof v === "string" && /^-?\d+(\.\d+)?px$/.test(v) ? parseFloat(v) : null);

function faceOf(style: TNode["style"]): Face {
  const family = String(style.fontFamily ?? "").split(",")[0].trim().replace(/^["']|["']$/g, "");
  const weight = Number(style.fontWeight ?? 400);
  if (family === "Instrument Serif") return "italic";
  // A design names its font outright: never the workspace's cover font.
  const id = COVER_FONT_IDS.find((f) => COVER_FONTS[f].name === family);
  if (id) return `${id}.${weight >= 700 ? "bold" : "semi"}`;
  return weight >= 800 ? "sansBold" : weight >= 600 ? "sansSemi" : "sans";
}

const norm = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** The brand colours the template reads through var(--ink) and friends. */
function colourVars(brand: CoverBrand): Record<string, string> {
  return { "--ink": brand.ink, "--paper": brand.paper, "--accent": brand.accent, "--secondary": brand.secondary };
}

const colourOf = (brand: CoverBrand, name: (typeof COLOUR_VARS)[number]) => brand[name];

function fitted(node: TNode, f: FitSpec, text: string, values: TemplateValues, brand: CoverBrand): ReactNode {
  const width = px(node.style.width) as number;
  const face = faceOf(node.style);
  // A hair of slack: word gaps are drawn as margins, which the metrics measure as spaces.
  const box = { face, maxWidth: Math.floor(width * 0.985), maxLines: f.maxLines };
  const first = fit(text, f.min, f.max, box);
  if (!first) throw new CoverFitError(`"${text.slice(0, 60)}" does not fit the ${f.slot.replace("_", " ")} box of this design (${f.maxLines} line${f.maxLines > 1 ? "s" : ""}, at least ${f.min}px).`);
  const result: Fitted = f.slot === "headline" ? balance(first, box) : first;
  const lh = typeof node.style.lineHeight === "number" ? node.style.lineHeight : 1.1;
  const align = String(node.style.textAlign ?? "left");
  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const emphasis = f.slot === "headline" && values.emphasis ? norm(values.emphasis) : "";
  let used = false;
  const gap = result.size * 0.26;
  const lines = result.lines.map((line, li) => {
    const words = line.split(" ");
    return createElement(
      "div",
      { key: li, style: { display: "flex", flexDirection: "row", justifyContent: justify, height: Math.round(result.size * lh) } },
      words.map((w, wi) => {
        const hit = !used && emphasis !== "" && norm(w) === emphasis;
        if (hit) used = true;
        const style: Record<string, unknown> = { display: "flex", marginRight: wi < words.length - 1 ? gap : 0 };
        if (hit && f.emphasisColour) style.color = colourOf(brand, f.emphasisColour);
        if (hit && f.emphasisFont === "Instrument Serif") Object.assign(style, faceStyle("italic"));
        return createElement("span", { key: wi, style }, w);
      }),
    );
  });
  return createElement(
    "div",
    { style: { ...node.style, display: "flex", flexDirection: "column", width, fontSize: result.size, lineHeight: lh } },
    lines,
  );
}

function build(node: TNode, values: TemplateValues, brand: CoverBrand, key: number): ReactNode {
  if (node.ifSlot && !values[node.ifSlot]?.trim()) return null;
  if (node.fit) {
    const text = (values[node.fit.slot] ?? "").replace(/\s+/g, " ").trim();
    if (!text) {
      if (SLOTS[node.fit.slot].required) throw new CoverFitError(`The ${node.fit.slot.replace("_", " ")} is empty.`);
      return null;
    }
    return fitted(node, node.fit, text, values, brand);
  }
  if (node.tag === "img") {
    const src = node.imageSlot ? values[node.imageSlot] : node.dataSrc;
    if (!src) return null;
    return createElement("img", { key, src, width: Number(node.attrs.width), height: Number(node.attrs.height), style: { display: "flex", ...node.style } });
  }
  const kids = node.children.map((c: TChild, i) => ("text" in c ? c.text : build(c, values, brand, i)));
  if (node.svg) {
    // Satori does not resolve var() inside SVG attributes, so the brand colour goes in directly.
    const attrs = Object.fromEntries(Object.entries(node.attrs).map(([k, v]) => [k, v.replace(/var\(--(ink|paper|accent|secondary)\)/g, (_m, c: (typeof COLOUR_VARS)[number]) => brand[c])]));
    return createElement(node.tag, { key, ...attrs, style: node.style }, ...kids);
  }
  return createElement(node.tag, { key, style: { display: "flex", ...node.style } }, ...kids);
}

/**
 * The template as a Satori element. Throws CoverFitError when a required
 * slot is empty or any text cannot fit its box, like every built-in design.
 */
export function templateElement(template: Template, values: TemplateValues, brand: CoverBrand): ReactNode {
  const root = template.root;
  const withVars: TNode = { ...root, style: { ...root.style, ...colourVars(brand) } };
  return build(withVars, values, brand, 0);
}
