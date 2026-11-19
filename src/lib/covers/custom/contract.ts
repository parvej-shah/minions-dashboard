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

/** A complete design that passes the check, shown at the end of the instructions (a test keeps it passing). */
export const PROMPT_EXAMPLE = `<div data-cover-template="${CONTRACT_VERSION}" data-name="Clean Card" style="display:flex;flex-direction:column;justify-content:space-between;width:${TEMPLATE_SIZE.width}px;height:${TEMPLATE_SIZE.height}px;padding:88px;overflow:hidden;background-color:var(--paper)">
  <div data-if="label" style="display:flex;align-self:flex-start;padding:10px 24px;border-radius:999px;background-color:var(--ink)">
    <div data-fit data-max-lines="1" data-min-size="30" data-max-size="34" style="width:600px;font-family:'Plus Jakarta Sans';font-weight:600;color:var(--paper)">{{label}}</div>
  </div>
  <div style="display:flex;flex-direction:column">
    <div data-fit data-max-lines="4" data-min-size="48" data-max-size="120" data-emphasis-color="accent" style="width:900px;font-family:'Bricolage Grotesque';font-weight:800;line-height:1.05;color:var(--ink)">{{headline}}</div>
    <div data-if="kicker" style="display:flex;margin-top:32px">
      <div data-fit data-max-lines="2" data-min-size="30" data-max-size="40" style="width:900px;font-family:'Plus Jakarta Sans';color:var(--secondary)">{{kicker}}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center">
    <div data-if="photo" style="display:flex;margin-right:24px"><img src="{{photo}}" width="120" height="120" style="border-radius:999px" /></div>
    <div data-fit data-max-lines="1" data-min-size="30" data-max-size="40" style="width:700px;font-family:'Plus Jakarta Sans';font-weight:600;color:var(--ink)">{{author_name}}</div>
    <svg width="64" height="64" viewBox="0 0 64 64" style="margin-left:auto"><circle cx="32" cy="32" r="28" fill="var(--accent)" /></svg>
  </div>
</div>`;

/**
 * The instructions we show users to paste into Claude, ChatGPT, Canva or any
 * designer. Built from the tables above and states every rule the parser and
 * the check enforce (check.test.ts keeps the two in step), so a design made
 * from it passes on the first try.
 */
export function contractPrompt(): string {
  const W = TEMPLATE_SIZE.width;
  const H = TEMPLATE_SIZE.height;
  const optional = SLOT_NAMES.filter((s) => !SLOTS[s].required && SLOTS[s].kind === "text").map((s) => `  - {{${s}}}: ${SLOTS[s].about}`);
  return [
    `Design a social media cover as ONE HTML snippet. It is drawn by the Satori renderer, which understands only a small part of HTML and CSS. Follow every rule below: a design that breaks any of them is refused and not saved.`,
    ``,
    `1. SIZE AND OUTER ELEMENT`,
    `- The cover is exactly ${W} x ${H} px.`,
    `- The outer element must be: <div data-cover-template="${CONTRACT_VERSION}" data-name="Short name" style="display:flex;position:relative;width:${W}px;height:${H}px;overflow:hidden;background-color:var(--paper)">`,
    `- data-name is a plain name of at most ${LIMITS.nameChars} characters.`,
    ``,
    `2. HTML AND CSS`,
    `- Use only these tags: ${[...TAGS].join(", ")}.`,
    `- Style each element with an inline style="" only. No <style>, no class, no <script>, no <link>, no event attributes like onclick. id is allowed only on SVG gradients.`,
    `- Every element uses display:flex (or display:none). No grid, block or inline layout.`,
    `- position may be relative or absolute; overflow may be hidden or visible.`,
    `- No calc(), no z-index, no animations or transitions, and no CSS variables other than the four colours in section 3.`,
    `- Only these style properties: ${[...STYLE_PROPS].join(", ")}.`,
    `- No web address anywhere: no http links, fonts or pictures from the internet.`,
    `- Limits: each style="" at most ${LIMITS.styleChars} characters, at most ${LIMITS.nodes} elements, nested at most ${LIMITS.depth} deep, the whole snippet at most ${LIMITS.sourceBytes / 1024} KB.`,
    ``,
    `3. COLOURS: THE COVER FOLLOWS THE BRAND THEME`,
    `- Use these four colours: var(--ink) for text, var(--paper) for the background, var(--accent) for highlights, var(--secondary) for a second colour. They change with the brand's theme.`,
    `- Every text colour, the cover's background and any background behind text must use these four. Gradients made of them are fine, e.g. linear-gradient(160deg, var(--paper), var(--accent)). Fixed colours there (like #1561F0, rgb(), rgba() or white) are refused.`,
    `- Only icons, lines and shapes that sit behind no text may use their own colours.`,
    `- Text must contrast at least 4.5:1 with what is behind it, on every colour theme: dark text on var(--paper), or var(--paper) text on var(--ink).`,
    ``,
    `4. TEXT: ONLY FROM SLOTS`,
    `- Required: {{headline}} (exactly once) and {{author_name}}.`,
    `- Optional:`,
    ...optional,
    `- Put each slot ALONE in its own element marked data-fit, like: <div data-fit data-max-lines="3" data-min-size="${MIN_SIZE.headline}" data-max-size="120" style="width:900px;font-family:'Bricolage Grotesque';font-weight:800;color:var(--ink)">{{headline}}</div>`,
    `- That element needs a width in px, a font-family and a theme colour. It must not have padding, a border, letter-spacing or text-transform; put padding and borders on a wrapper element around it.`,
    `- data-max-lines is a whole number from 1 to ${MAX_LINES}. data-min-size and data-max-size are whole px up to ${MAX_SIZE}; data-min-size is at least ${MIN_SIZE.headline} for the headline and ${MIN_SIZE.other} for other text, and never bigger than data-max-size. line-height, if set, is a plain number from 0.8 to 2.`,
    `- Text shrinks between the two sizes to fit. Make each box big enough for long text: the headline box must fit "${SAMPLE_POSTS.long.headline}" at data-min-size within data-max-lines.`,
    `- Wrap every optional slot's element in a parent with data-if="slot_name", e.g. <div data-if="kicker" style="display:flex">...</div>, so nothing shows when it is empty.`,
    `- To highlight one headline word, add data-emphasis-color="accent" (or ink, paper, secondary) to the headline element; data-emphasis-font="Instrument Serif" also sets that word in italic. Do not write {{emphasis}} yourself.`,
    `- Fixed words written into the design (like "Book now") are allowed, at most ${LIMITS.textChars} characters per element. They appear on every cover and must use a theme colour too.`,
    ``,
    `5. PICTURES AND ICONS`,
    `- The author's headshot: <img src="{{photo}}" width="200" height="200">. A transparent cut-out of the author: <img src="{{cutout}}" width="600" height="800">. Wrap each in a parent with data-if="photo" or data-if="cutout". width and height are whole px from 1 to 2000, and <img> holds nothing inside.`,
    `- Any other picture must be an inline data:image/png, jpeg or webp, at most ${LIMITS.inlineImageBytes / 1024} KB for all of them together. In CSS, url() is allowed only in background-image with such an inline picture.`,
    `- Inline <svg> icons and shapes are fine. SVG holds no text and no slots, and url() inside SVG may only point at a gradient in the same SVG, like url(#g1).`,
    ``,
    `6. FONTS`,
    `- Only: ${FONTS.join(", ")}. Write them like font-family:'Space Grotesk'.`,
    ``,
    `7. EXAMPLE THAT PASSES`,
    PROMPT_EXAMPLE,
    ``,
    `Return only the HTML, with no explanation.`,
  ].join("\n");
}
