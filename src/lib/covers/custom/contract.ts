/**
 * The cover template contract (docs/research/cover-template-contract-2026-11-19.md).
 * One source for the parser, the checker, the renderer and the paste-ready
 * prompt we show users, so the four can never disagree. A pasted template is
 * untrusted input: parse.ts accepts only what is listed here and refuses
 * everything else, it never "cleans" and keeps going.
 */

export const CONTRACT_VERSION = 1;
export const TEMPLATE_SIZE = { width: 1080, height: 1350 } as const;

/** Slots a template may use. `required` slots must appear; `optional` ones must sit under data-if. */
export const SLOTS = {
  headline: { kind: "text", required: true, about: "The post's cover line. Appears exactly once." },
  author_name: { kind: "text", required: true, about: "The author's name from the brand." },
  emphasis: { kind: "word", required: false, about: "The one headline word to highlight." },
  label: { kind: "text", required: false, about: 'Who it is for, e.g. "For real estate teams".' },
  kicker: { kind: "text", required: false, about: "One supporting line." },
  quote: { kind: "text", required: false, about: "A sentence word for word from the post." },
  number_value: { kind: "text", required: false, about: "A verified figure." },
  number_unit: { kind: "text", required: false, about: "The figure's unit." },
  author_role: { kind: "text", required: false, about: "The byline role." },
  list_1: { kind: "text", required: false, about: "First point of the post." },
  list_2: { kind: "text", required: false, about: "Second point." },
  list_3: { kind: "text", required: false, about: "Third point." },
  list_4: { kind: "text", required: false, about: "Fourth point." },
  photo: { kind: "image", required: false, about: "The author's headshot." },
  cutout: { kind: "image", required: false, about: "The author's transparent cut-out." },
} as const;

export type SlotName = keyof typeof SLOTS;
export const SLOT_NAMES = Object.keys(SLOTS) as SlotName[];
export const REQUIRED_SLOTS = SLOT_NAMES.filter((s) => SLOTS[s].required);
export const isSlot = (s: string): s is SlotName => Object.prototype.hasOwnProperty.call(SLOTS, s);
export const isTextSlot = (s: SlotName) => SLOTS[s].kind === "text";
export const isImageSlot = (s: SlotName) => SLOTS[s].kind === "image";

/** Whitespace is allowed inside the braces; the slot name never is padded otherwise. */
export const SLOT_TOKEN = /\{\{\s*([a-z0-9_]+)\s*\}\}/g;

export const LIMITS = {
  sourceBytes: 200 * 1024,
  nodes: 400,
  depth: 24,
  inlineImageBytes: 500 * 1024,
  styleChars: 2000,
  valueChars: 400,
  textChars: 300,
  nameChars: 40,
  templatesPerWorkspace: 10,
} as const;

export const TAGS = new Set(["div", "span", "p", "h1", "h2", "h3", "img", "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "defs", "lineargradient", "radialgradient", "stop"]);
export const SVG_TAGS = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "defs", "lineargradient", "radialgradient", "stop"]);

/** Fonts we bundle (fonts.ts FONT_FAMILIES; a test keeps the two equal). Anything else is refused. */
export const FONTS = ["Bricolage Grotesque", "Anton", "Unbounded", "Syne", "Space Grotesk", "DM Serif Display", "Plus Jakarta Sans", "Instrument Serif"] as const;
export const GENERIC_FONTS = ["sans-serif", "serif"];

/** The colour variables a template may read; we fill them from the workspace's checked brand colours. */
export const COLOUR_VARS = ["ink", "paper", "accent", "secondary"] as const;
export type ColourVar = (typeof COLOUR_VARS)[number];

/** Inline style properties (kebab-case) a template may set. Anything else is an error. */
export const STYLE_PROPS = new Set([
  "display", "flex", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis", "align-items", "align-self", "align-content", "justify-content",
  "gap", "row-gap", "column-gap", "width", "height", "min-width", "max-width", "min-height", "max-height", "box-sizing",
  "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "position", "top", "right", "bottom", "left", "overflow",
  "background", "background-color", "background-image", "background-size", "background-position", "background-repeat",
  "border", "border-top", "border-right", "border-bottom", "border-left", "border-width", "border-style", "border-color",
  "border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
  "box-shadow", "opacity", "color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "text-transform", "text-decoration",
  "transform", "transform-origin", "filter", "object-fit", "object-position",
]);

/** Functions that may appear in a style value. url() is checked separately; calc, env, attr, image-set are refused. */
export const STYLE_FUNCTIONS = new Set([
  "rgb", "rgba", "hsl", "hsla", "linear-gradient", "radial-gradient", "repeating-linear-gradient", "repeating-radial-gradient", "var", "url",
  "translate", "translatex", "translatey", "rotate", "scale", "scalex", "scaley", "skew", "skewx", "skewy", "blur", "brightness", "contrast", "grayscale", "saturate", "hue-rotate", "invert", "sepia", "opacity", "drop-shadow",
]);

export const DISPLAY_VALUES = new Set(["flex", "none"]);
export const POSITION_VALUES = new Set(["relative", "absolute"]);
export const OVERFLOW_VALUES = new Set(["hidden", "visible"]);

/** Data attributes: only these, and where they may sit. */
export const DATA_ATTRS = new Set(["data-cover-template", "data-name", "data-fit", "data-max-lines", "data-min-size", "data-max-size", "data-if", "data-emphasis-color", "data-emphasis-font"]);

/** SVG presentation attributes (kebab-case). Values are checked: no scripts, url() only as url(#id). */
export const SVG_ATTRS = new Set([
  "viewbox", "width", "height", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-opacity", "fill-opacity", "fill-rule", "opacity",
  "d", "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2", "points", "transform", "offset", "stop-color", "stop-opacity", "id", "gradientunits", "gradienttransform", "xmlns",
]);

/** Smallest sizes a fitted text may shrink to (px on the 1080 canvas; a phone feed shows a third of this). */
export const MIN_SIZE = { headline: 48, other: 30 } as const;
export const MAX_SIZE = 220;
export const MAX_LINES = 6;

/** What the cover check renders (check.ts). */
export const SAMPLE_POSTS = {
  short: { headline: "Hire faster", author_name: "Alex Rahman" },
  long: {
    headline: "Why callers hang up on your voice agent at exactly 1.8 seconds and what to fix first",
    author_name: "Alexandra Rahman-Whitfield",
    emphasis: "hang",
    label: "For real estate teams",
    kicker: "Three fixes that took one afternoon and cut drop-offs by half",
    quote: "The first two seconds decide whether anyone stays on the line.",
    number_value: "1.8",
    number_unit: "seconds",
    author_role: "Founder, Minions AI",
    list_1: "Answer on the first ring",
    list_2: "Greet before you qualify",
    list_3: "Never read a script aloud",
    list_4: "Hand off with context",
  },
  bare: { headline: "Ship the small thing today", author_name: "Alex Rahman" },
} as const;

/** The text we show users to paste into Claude, Canva or any designer. Built from the tables above. */
export function contractPrompt(): string {
  const req = REQUIRED_SLOTS.map((s) => `{{${s}}}`).join(" and ");
  const opt = SLOT_NAMES.filter((s) => !SLOTS[s].required && s !== "emphasis").map((s) => `{{${s}}}`).join(" ");
  return [
    `Design a social cover as ONE HTML snippet, ${TEMPLATE_SIZE.width}x${TEMPLATE_SIZE.height}px, for the Satori renderer: a CSS subset.`,
    `Flexbox only (every div uses display:flex). Inline style="" only: no <style>, classes, <script>, <link>, grid, calc(), z-index or external URLs.`,
    `The root must be: <div data-cover-template="${CONTRACT_VERSION}" data-name="Short name" style="display:flex;width:${TEMPLATE_SIZE.width}px;height:${TEMPLATE_SIZE.height}px;overflow:hidden;...">.`,
    `Allowed tags: ${[...TAGS].join(", ")}.`,
    `Text comes only from slots. Required: ${req}. Optional: ${opt}.`,
    `Put every text slot ALONE inside its own element, written as <div data-fit data-max-lines="3" data-min-size="${MIN_SIZE.headline}" data-max-size="120" style="width:900px;font-family:'Bricolage Grotesque';font-weight:800;color:var(--ink)">{{headline}}</div>.`,
    `A fitted element needs a width in px, a font-family, no padding or border, data-min-size of at least ${MIN_SIZE.headline} for the headline and ${MIN_SIZE.other} for other text.`,
    `Wrap every optional slot's element in data-if="slot_name", e.g. <div data-if="kicker">...</div>, so nothing shows when it is empty.`,
    `Images only as <img src="{{photo}}" width="200" height="200"> (or {{cutout}}), inside a data-if. Inline <svg> shapes are fine.`,
    `Colours come from the brand theme: var(--ink), var(--paper), var(--accent), var(--secondary). Every text colour, the cover's background and any background behind text must use these (gradients of them are fine). Only icons, lines and shapes may use their own colours.`,
    `Fonts: ${FONTS.join(", ")} only.`,
    `Optional: data-emphasis-color="accent" on the headline element highlights the {{emphasis}} word.`,
    `Return only the HTML.`,
  ].join("\n");
}
