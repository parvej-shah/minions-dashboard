/**
 * Carousel slide layouts (phase 11 of docs/product/authority-flywheel-plan.md,
 * D19). Slide 1 is the post's cover, drawn by src/lib/covers; every slide
 * after it shares one frame -- a label and page marker at the top, a progress
 * track and the author's name at the bottom -- so the deck reads as one
 * designed piece, and the layouts vary only the centre.
 *
 * The frame comes in a few styles (SLIDE_STYLES) the plan picks per post.
 * Styles change colour and chrome only, never the geometry, so a plan that
 * fits in one style fits in all of them.
 *
 * Same rules as the covers: every letter is drawn in code, fit.ts sets every
 * size and line break, and copy that cannot fit is rejected, never cut. Body
 * copy never goes below 40px on the 1080-wide page, so it reads on a phone.
 */
import type { ReactNode } from "react";
import { faceStyle, metricsFor } from "@/lib/covers/fonts";
import { balance, fit, type Fitted, type TextBox } from "@/lib/covers/fit";
import { contrast } from "@/lib/covers/brand";
import { textWidth } from "@/lib/covers/metrics";
import { COVER_SIZE, CoverFitError, INNER, Lines, PAD, coverElement, initials, rgba, type CoverAuthor, type CoverBrand, type CoverSpec } from "@/lib/covers/layouts";

export const SLIDE_SIZE = COVER_SIZE;

export const SLIDE_LAYOUTS = ["STAKES", "POINT", "STEP", "CONTRAST", "CHECKLIST", "NUMBER", "QUOTE", "CLOSE"] as const;
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

/**
 * Page colours are the brand's ink and paper, swapped on "dark" pages, so a
 * brand with light ink gets light "dark" pages.
 * EDITORIAL: paper pages, ink opening and closing pages, a thin progress track.
 * BOLD: every page ink, an accent edge, the label on an accent chip, one progress segment per page.
 * MINIMAL: every page paper, a hairline track, the accent kept to the words.
 */
export const SLIDE_STYLES = ["EDITORIAL", "BOLD", "MINIMAL"] as const;
export type SlideStyle = (typeof SLIDE_STYLES)[number];
export const DEFAULT_SLIDE_STYLE: SlideStyle = "EDITORIAL";

export type Slide =
  /** Why this matters now: one statement, set large on the dark page. */
  | { layout: "STAKES"; statement: string; body?: string; emphasis?: string }
  /** One point of the argument, numbered in order among the POINT slides. */
  | { layout: "POINT"; title: string; body?: string; emphasis?: string }
  /** One step of a sequence, with its place in the sequence drawn. */
  | { layout: "STEP"; title: string; body?: string; emphasis?: string }
  /** Common assumption against what happens in practice. */
  | { layout: "CONTRAST"; before: string; after: string; beforeLabel?: string; afterLabel?: string }
  | { layout: "CHECKLIST"; title: string; items: string[] }
  /** A figure the author's memory or approved proof states. Never invented. */
  | { layout: "NUMBER"; value: string; unit?: string; caption: string }
  /** The author's own words, from their memory. */
  | { layout: "QUOTE"; quote: string; attribution?: string }
  /** The takeaway, the author, and a soft save line. Always last. */
  | { layout: "CLOSE"; takeaway: string; saveLine?: string };

export interface Deck {
  /** Slide 1: the post's cover spec, unchanged. */
  cover: CoverSpec;
  /** Slides 2..n. */
  slides: Slide[];
  /** The small label at the top of every inner slide, e.g. the post's short title. */
  label: string;
  author: CoverAuthor;
  brand: CoverBrand;
  /** The frame's style. Missing on decks stored before styles: EDITORIAL. */
  style?: SlideStyle;
}

// Chrome: label row, gaps, progress track, name row.
const TOP_ROW = 40;
const TOP_GAP = 64;
const BOTTOM_GAP = 56;
const TRACK = 4;
const TRACK_GAP = 28;
const NAME_ROW = 32;
const CENTRE = SLIDE_SIZE.height - PAD * 2 - TOP_ROW - TOP_GAP - BOTTOM_GAP - TRACK - TRACK_GAP - NAME_ROW;

const BOX = {
  chrome: { face: "sansSemi", maxWidth: INNER - 220, maxLines: 1, tracking: 0.12 },
  statement: { face: "serif", maxWidth: INNER, maxLines: 7, tracking: -0.02 },
  title: { face: "serif", maxWidth: INNER, maxLines: 5, tracking: -0.015 },
  body: { face: "sans", maxWidth: INNER, maxLines: 7 },
  before: { face: "serifItalic", maxWidth: INNER, maxLines: 5, tracking: -0.01 },
  after: { face: "serif", maxWidth: INNER, maxLines: 5, tracking: -0.015 },
  item: { face: "sans", maxWidth: INNER - 84, maxLines: 3 },
  quote: { face: "serifItalic", maxWidth: INNER, maxLines: 8, tracking: -0.01 },
  caption: { face: "serif", maxWidth: INNER, maxLines: 4, tracking: -0.015 },
  takeaway: { face: "serif", maxWidth: INNER, maxLines: 6, tracking: -0.015 },
  save: { face: "sansSemi", maxWidth: INNER - 64, maxLines: 2 },
  name: { face: "sansSemi", maxWidth: INNER - 172, maxLines: 1 },
  role: { face: "sans", maxWidth: INNER - 172, maxLines: 2 },
} satisfies Record<string, TextBox>;

const SIZES: Record<keyof typeof BOX, readonly [number, number]> = {
  chrome: [24, 26],
  statement: [64, 120],
  title: [60, 112],
  body: [40, 46],
  before: [44, 68],
  after: [52, 84],
  item: [40, 46],
  quote: [52, 96],
  caption: [48, 72],
  takeaway: [56, 92],
  save: [30, 34],
  name: [36, 40],
  role: [28, 32],
};

const LH = { statement: 1.08, title: 1.08, body: 1.38, before: 1.2, after: 1.12, item: 1.3, quote: 1.18, caption: 1.12, takeaway: 1.1, save: 1.3 } as const;

/** Typographic quotes and apostrophes: straight marks look unfinished beside the serif's curly ones. */
export function smartQuotes(text: string): string {
  return text
    .replace(/(^|[\s(\[{“])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(^|[\s(\[{‘])'/g, "$1‘")
    .replace(/'/g, "’");
}

function fitOrThrow(what: keyof typeof BOX, raw: string, maxHeight?: number, lineHeight?: number): Fitted {
  const [min, max] = SIZES[what];
  const text = smartQuotes(raw);
  const box = { ...BOX[what], ...(maxHeight !== undefined ? { maxHeight, lineHeight } : {}) };
  const f = fit(text, min, max, box);
  if (!f) throw new CoverFitError(`The ${what} is too long for a slide: "${text.slice(0, 80)}"`);
  return balance(f, box);
}

const height = (f: Fitted, lh: number) => f.lines.length * f.size * lh;
const svg = (s: string) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;

/** The swipe cue, drawn: the bundled fonts carry no arrow glyph. */
const arrow = (colour: string) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24"><path d="M2 12 H36 M26 3 L37 12 L26 21" fill="none" stroke="${colour}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

interface Page {
  style: SlideStyle;
  ink: string;
  paper: string;
  accent: string;
  /** 0-based index of this slide in the whole deck, cover included. */
  index: number;
  total: number;
}

/** The label at the top left: a short accent bar before it, an accent chip behind it, or the label alone. */
function LabelMark({ label, page }: { label: Fitted; page: Page }) {
  const { style, ink, paper, accent } = page;
  if (style === "BOLD") {
    const on = contrast(ink, accent) > contrast(paper, accent) ? ink : paper;
    return (
      <div style={{ display: "flex", alignItems: "center", height: TOP_ROW, paddingLeft: 16, paddingRight: 16, borderRadius: 6, background: accent }}>
        <Lines fitted={label} face="sansSemi" tracking={0.12} lineHeight={1} color={on} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {style === "EDITORIAL" ? <div style={{ width: 44, height: 6, background: accent, marginRight: 20 }} /> : null}
      <Lines fitted={label} face="sansSemi" tracking={0.12} lineHeight={1} color={rgba(ink, style === "MINIMAL" ? 0.55 : 0.7)} />
    </div>
  );
}

const SEGMENT_GAP = 8;

/** How far through the deck this page is: a track, one segment per page, or a hairline. */
function Progress({ page }: { page: Page }) {
  const { style, ink, accent, index, total } = page;
  if (style === "BOLD") {
    const w = (INNER - SEGMENT_GAP * (total - 1)) / total;
    return (
      <div style={{ display: "flex", height: TRACK, marginBottom: TRACK_GAP }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ width: w, height: TRACK, marginRight: i + 1 < total ? SEGMENT_GAP : 0, background: i <= index ? accent : rgba(ink, 0.16) }} />
        ))}
      </div>
    );
  }
  const line = style === "MINIMAL" ? 2 : TRACK;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: TRACK, marginBottom: TRACK_GAP }}>
      <div style={{ display: "flex", width: INNER, height: line, background: rgba(ink, 0.12) }}>
        <div style={{ width: Math.round((INNER * (index + 1)) / total), height: line, background: style === "MINIMAL" ? rgba(ink, 0.6) : accent }} />
      </div>
    </div>
  );
}

function Frame({ deck, page, children }: { deck: Deck; page: Page; children: ReactNode }) {
  const { style, ink, paper, accent, index, total } = page;
  const label = fitOrThrow("chrome", deck.label.toUpperCase());
  const marker = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const markerWidth = textWidth(metricsFor("sansSemi"), marker, 26, 0.12 * 26);
  const name = fitOrThrow("chrome", deck.author.name);
  const last = index === total - 1;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: paper, padding: PAD, position: "relative" }}>
      {/* BOLD's accent edge sits in the margin, outside the text. */}
      {style === "BOLD" ? <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: SLIDE_SIZE.height, background: accent }} /> : null}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: TOP_ROW, marginBottom: TOP_GAP }}>
        <LabelMark label={label} page={page} />
        <div style={{ display: "flex", width: markerWidth + 4, ...faceStyle("sansSemi"), fontSize: 26, letterSpacing: 0.12 * 26, color: rgba(ink, 0.5) }}>{marker}</div>
      </div>

      <div style={{ height: CENTRE, display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: BOTTOM_GAP }}>{children}</div>

      <Progress page={page} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: NAME_ROW }}>
        {/* The close slide carries the author card, so the name is not repeated under it. */}
        {last ? <div style={{ display: "flex" }} /> : <Lines fitted={name} face="sansSemi" tracking={0.12} lineHeight={1} color={rgba(ink, 0.6)} />}
        {last ? null : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={arrow(style === "MINIMAL" ? rgba(ink, 0.6) : accent)} width={40} height={24} alt="" />
        )}
      </div>
    </div>
  );
}

/** A title (serif) with an optional body line under it, sharing the height left by `reserved`. */
function TitleBody({ title, body, emphasis, page, reserved }: { title: string; body?: string; emphasis?: string; page: Page; reserved: number }) {
  const bodyFit = body ? fitOrThrow("body", body) : null;
  const bodyHeight = bodyFit ? 48 + height(bodyFit, LH.body) : 0;
  const titleFit = fitOrThrow("title", title, CENTRE - reserved - bodyHeight, LH.title);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines fitted={titleFit} face="serif" tracking={-0.015} lineHeight={LH.title} color={page.ink} emphasis={emphasis} accent={page.accent} />
      {bodyFit ? (
        <div style={{ display: "flex", marginTop: 48 }}>
          <Lines fitted={bodyFit} face="sans" lineHeight={LH.body} color={rgba(page.ink, 0.74)} />
        </div>
      ) : null}
    </div>
  );
}

const NUMERAL = 150;

function PointCentre({ slide, page, n }: { slide: Extract<Slide, { layout: "POINT" }>; page: Page; n: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", ...faceStyle("serifItalic"), fontSize: NUMERAL, lineHeight: 1, height: NUMERAL, marginBottom: 40, color: page.accent }}>{String(n).padStart(2, "0")}</div>
      {TitleBody({ title: slide.title, body: slide.body, emphasis: slide.emphasis, page, reserved: NUMERAL + 40 })}
    </div>
  );
}

function StepCentre({ slide, page, n, of }: { slide: Extract<Slide, { layout: "STEP" }>; page: Page; n: number; of: number }) {
  const label = `STEP ${n} OF ${of}`;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", height: 56, marginBottom: 56 }}>
        {Array.from({ length: of }, (_, i) => (
          <div key={i} style={{ display: "flex", width: i + 1 === n ? 56 : 20, height: 20, borderRadius: 10, marginRight: 14, background: i + 1 <= n ? page.accent : rgba(page.ink, 0.16) }} />
        ))}
        <div style={{ display: "flex", marginLeft: 18, ...faceStyle("sansSemi"), fontSize: 28, letterSpacing: 0.12 * 28, color: rgba(page.ink, 0.66) }}>{label}</div>
      </div>
      {TitleBody({ title: slide.title, body: slide.body, emphasis: slide.emphasis, page, reserved: 112 })}
    </div>
  );
}

function StakesCentre({ slide, page }: { slide: Extract<Slide, { layout: "STAKES" }>; page: Page }) {
  const bodyFit = slide.body ? fitOrThrow("body", slide.body) : null;
  const bodyHeight = bodyFit ? 56 + height(bodyFit, LH.body) : 0;
  const statement = fitOrThrow("statement", slide.statement, CENTRE - bodyHeight - 62, LH.statement);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ width: 120, height: 6, background: page.accent, marginBottom: 56 }} />
      <Lines fitted={statement} face="serif" tracking={-0.02} lineHeight={LH.statement} color={page.ink} emphasis={slide.emphasis} accent={page.accent} />
      {bodyFit ? (
        <div style={{ display: "flex", marginTop: 56 }}>
          <Lines fitted={bodyFit} face="sans" lineHeight={LH.body} color={rgba(page.ink, 0.74)} />
        </div>
      ) : null}
    </div>
  );
}

function ContrastCentre({ slide, page }: { slide: Extract<Slide, { layout: "CONTRAST" }>; page: Page }) {
  const labels = 2 * (30 + 28);
  const divider = 2 + 2 * 64;
  const half = (CENTRE - labels - divider) / 2;
  const before = fitOrThrow("before", slide.before, half, LH.before);
  const after = fitOrThrow("after", slide.after, half, LH.after);
  const tag = (text: string, color: string) => (
    <div style={{ display: "flex", ...faceStyle("sansSemi"), fontSize: 26, lineHeight: 1.15, letterSpacing: 0.12 * 26, color, marginBottom: 28 }}>{text.toUpperCase()}</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {tag(slide.beforeLabel || "Common assumption", rgba(page.ink, 0.5))}
      <Lines fitted={before} face="serifItalic" tracking={-0.01} lineHeight={LH.before} color={rgba(page.ink, 0.58)} />
      <div style={{ height: 2, background: rgba(page.ink, 0.14), marginTop: 64, marginBottom: 64 }} />
      {tag(slide.afterLabel || "In practice", page.accent)}
      <Lines fitted={after} face="serif" tracking={-0.015} lineHeight={LH.after} color={page.ink} />
    </div>
  );
}

const CHECK = 52;
const ITEM_GAP = 40;

function ChecklistCentre({ slide, page }: { slide: Extract<Slide, { layout: "CHECKLIST" }>; page: Page }) {
  const items = slide.items.map((t) => smartQuotes(t.trim())).filter(Boolean);
  if (items.length < 2 || items.length > 5) throw new CoverFitError(`A checklist slide takes 2 to 5 items, not ${items.length}.`);
  // One size for every item, so the list reads as a list: the largest at which all fit.
  const [min, max] = SIZES.item;
  let fitted: Fitted[] | null = null;
  for (let size = max; size >= min && !fitted; size -= 2) {
    const all = items.map((t) => fit(t, size, size, BOX.item));
    if (all.every(Boolean)) fitted = (all as Fitted[]).map((f) => balance(f, BOX.item));
  }
  if (!fitted) throw new CoverFitError(`A checklist item is too long for a slide.`);
  const itemsHeight = fitted.reduce((h, f) => h + Math.max(CHECK, height(f, LH.item)), 0) + ITEM_GAP * (items.length - 1);
  const title = fitOrThrow("title", slide.title, CENTRE - itemsHeight - 64, LH.title);
  const tick = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${CHECK}" height="${CHECK}" viewBox="0 0 52 52"><rect x="2" y="2" width="48" height="48" rx="10" fill="${page.accent}"/><path d="M15 27 l8 8 l15 -17" fill="none" stroke="${page.paper}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines fitted={title} face="serif" tracking={-0.015} lineHeight={LH.title} color={page.ink} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
        {fitted.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", marginTop: i ? ITEM_GAP : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tick} width={CHECK} height={CHECK} style={{ marginRight: 32, marginTop: Math.max(0, (f.size * LH.item - CHECK) / 2) }} alt="" />
            <Lines fitted={f} face="sans" lineHeight={LH.item} color={page.ink} />
          </div>
        ))}
      </div>
    </div>
  );
}

const UNIT_SIZE = 72;

function NumberCentre({ slide, page, secondary }: { slide: Extract<Slide, { layout: "NUMBER" }>; page: Page; secondary: string }) {
  const unitWidth = slide.unit ? textWidth(metricsFor("serifItalic"), slide.unit, UNIT_SIZE) + 24 : 0;
  const value = fit(slide.value, 160, 360, { face: "sansBold", maxWidth: INNER - unitWidth, maxLines: 1, tracking: -0.04 });
  if (!value || !slide.value.trim()) throw new CoverFitError(`The number does not fit a slide: "${slide.value}"`);
  const caption = fitOrThrow("caption", slide.caption, CENTRE - value.size * 0.9 - 110, LH.caption);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div style={{ display: "flex", ...faceStyle("sansBold"), fontSize: value.size, lineHeight: 0.9, letterSpacing: -0.04 * value.size, color: secondary }}>{slide.value}</div>
        {slide.unit ? <div style={{ display: "flex", ...faceStyle("serifItalic"), fontSize: UNIT_SIZE, marginLeft: 24, marginBottom: value.size * 0.06, color: page.ink }}>{slide.unit}</div> : null}
      </div>
      <div style={{ height: 6, width: 120, background: page.accent, marginTop: 56, marginBottom: 48 }} />
      <Lines fitted={caption} face="serif" tracking={-0.015} lineHeight={LH.caption} color={page.ink} />
    </div>
  );
}

const QUOTE_MARK = 150;

function QuoteCentre({ slide, page }: { slide: Extract<Slide, { layout: "QUOTE" }>; page: Page }) {
  const attribution = slide.attribution ? fitOrThrow("save", slide.attribution) : null;
  const attributionHeight = attribution ? 48 + height(attribution, LH.save) : 0;
  const quote = fitOrThrow("quote", slide.quote, CENTRE - QUOTE_MARK - attributionHeight, LH.quote);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", ...faceStyle("serif"), fontSize: 260, lineHeight: 0.8, height: QUOTE_MARK, color: page.accent }}>“</div>
      <Lines fitted={quote} face="serifItalic" tracking={-0.01} lineHeight={LH.quote} color={page.ink} />
      {attribution ? (
        <div style={{ display: "flex", marginTop: 48 }}>
          <Lines fitted={attribution} face="sansSemi" lineHeight={LH.save} color={rgba(page.ink, 0.66)} />
        </div>
      ) : null}
    </div>
  );
}

const PHOTO = 132;

function CloseCentre({ slide, page, deck }: { slide: Extract<Slide, { layout: "CLOSE" }>; page: Page; deck: Deck }) {
  const { author } = deck;
  const name = fitOrThrow("name", author.name);
  const role = author.role ? fitOrThrow("role", author.role) : null;
  const save = slide.saveLine ? fitOrThrow("save", slide.saveLine) : null;
  const saveHeight = save ? 56 + Math.max(44, height(save, LH.save)) : 0;
  const card = 2 + 64 * 2 + PHOTO;
  const takeaway = fitOrThrow("takeaway", slide.takeaway, CENTRE - card - saveHeight, LH.takeaway);
  const bookmark = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M4 4 h28 v36 l-14 -10 l-14 10 z" fill="none" stroke="${page.accent}" stroke-width="4" stroke-linejoin="round"/></svg>`);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines fitted={takeaway} face="serif" tracking={-0.015} lineHeight={LH.takeaway} color={page.ink} />
      <div style={{ height: 2, background: rgba(page.ink, 0.18), marginTop: 64, marginBottom: 64 }} />
      <div style={{ display: "flex", alignItems: "center" }}>
        {author.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.photo} width={PHOTO} height={PHOTO} style={{ borderRadius: PHOTO / 2, objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2, background: page.accent, color: contrast(page.ink, page.accent) > contrast(page.paper, page.accent) ? page.ink : page.paper, display: "flex", alignItems: "center", justifyContent: "center", ...faceStyle("sansBold"), fontSize: 48 }}>
            {initials(author.name)}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 36 }}>
          <Lines fitted={name} face="sansSemi" lineHeight={1.2} color={page.ink} />
          {role ? (
            <div style={{ display: "flex", marginTop: 6 }}>
              <Lines fitted={role} face="sans" lineHeight={1.3} color={rgba(page.ink, 0.66)} />
            </div>
          ) : null}
        </div>
      </div>
      {save ? (
        <div style={{ display: "flex", alignItems: "center", marginTop: 56 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bookmark} width={36} height={44} style={{ marginRight: 28 }} alt="" />
          <Lines fitted={save} face="sansSemi" lineHeight={LH.save} color={page.accent} />
        </div>
      ) : null}
    </div>
  );
}

/** EDITORIAL puts STAKES and CLOSE on the dark page: they bracket the argument, and give the deck rhythm. */
const DARK: SlideLayout[] = ["STAKES", "CLOSE"];

function isDark(style: SlideStyle, layout: SlideLayout): boolean {
  if (style === "BOLD") return true;
  if (style === "MINIMAL") return false;
  return DARK.includes(layout);
}

/** Slide i of the deck (0 is the cover) as a Satori element. Throws CoverFitError when any text cannot fit. */
export function slideElement(deck: Deck, i: number) {
  if (i === 0) return coverElement(deck.cover);
  const slide = deck.slides[i - 1];
  if (!slide) throw new RangeError(`The deck has no slide ${i + 1}.`);
  const { brand } = deck;
  const style = deck.style ?? DEFAULT_SLIDE_STYLE;
  const dark = isDark(style, slide.layout);
  const page: Page = {
    style,
    ink: dark ? brand.paper : brand.ink,
    paper: dark ? brand.ink : brand.paper,
    accent: dark ? brand.accentOnInk : brand.accent,
    index: i,
    total: deck.slides.length + 1,
  };
  // Numbered in order among slides of the same layout, so POINT 1, 2, 3 and STEP 1 of 3 stay right after a reorder.
  const same = deck.slides.filter((s) => s.layout === slide.layout);
  const n = deck.slides.slice(0, i).filter((s) => s.layout === slide.layout).length;
  // Called as functions, not rendered as components, so every fit runs now.
  const centre =
    slide.layout === "STAKES" ? StakesCentre({ slide, page })
    : slide.layout === "POINT" ? PointCentre({ slide, page, n })
    : slide.layout === "STEP" ? StepCentre({ slide, page, n, of: same.length })
    : slide.layout === "CONTRAST" ? ContrastCentre({ slide, page })
    : slide.layout === "CHECKLIST" ? ChecklistCentre({ slide, page })
    : slide.layout === "NUMBER" ? NumberCentre({ slide, page, secondary: dark ? page.accent : brand.secondary })
    : slide.layout === "QUOTE" ? QuoteCentre({ slide, page })
    : CloseCentre({ slide, page, deck });
  return Frame({ deck, page, children: centre });
}
