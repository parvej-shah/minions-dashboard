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
 * STAKES, POINT and STEP pages may carry one line icon (icons.ts), picked by
 * the plan, drawn faint below the words. The words always win: the icon is
 * dropped when the headline would not fit beside it, or would shrink below
 * ICON_KEEP of its size without the icon, or below ICON_FLOOR.
 *
 * Same rules as the covers: every letter is drawn in code, fit.ts sets every
 * size and line break, and copy that cannot fit is rejected, never cut. Body
 * copy never goes below 40px on the 1080-wide page, so it reads on a phone.
 */
import type { ReactNode } from "react";
import { faceStyle, metricsFor } from "@/lib/covers/fonts";
import { balance, fit, type Fitted, type TextBox } from "@/lib/covers/fit";
import { contrast } from "@/lib/covers/brand";
import { blockColour } from "@/lib/covers/backgrounds";
import { textWidth } from "@/lib/covers/metrics";
import { ICONS, type IconName } from "@/lib/covers/icons";
import { COVER_SIZE, CoverFitError, INNER, Lines, PAD, coverElement, initials, rgba, type CoverAuthor, type CoverBrand, type CoverSpec } from "@/lib/covers/layouts";
import type { Face } from "@/lib/covers/fonts";

export const SLIDE_SIZE = COVER_SIZE;

export const SLIDE_LAYOUTS = ["STAKES", "POINT", "STEP", "CONTRAST", "CHECKLIST", "NUMBER", "QUOTE", "CLOSE", "GRID", "PUNCH"] as const;
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

/**
 * Page colours are the brand's ink and paper, swapped on "dark" pages, so a
 * brand with light ink gets light "dark" pages.
 * EDITORIAL: paper pages, ink opening and closing pages, a thin progress track.
 * BOLD: every page ink, an accent edge, the label on an accent chip, one progress segment per page.
 * MINIMAL: every page paper, a hairline track, the accent kept to the words.
 * POSTER: dark and light pages in turn, under one drawing that runs across the
 * whole deck (a ribbon with a node per page, glows sitting on the seams), key
 * words on a highlighter block, giant numerals, a split contrast page. It
 * trades some centre height for the ribbon's lane (POSTER_CENTRE).
 */
export const SLIDE_STYLES = ["EDITORIAL", "BOLD", "MINIMAL", "POSTER"] as const;
export type SlideStyle = (typeof SLIDE_STYLES)[number];
export const DEFAULT_SLIDE_STYLE: SlideStyle = "EDITORIAL";

export type Slide =
  /** Why this matters now: one statement, set large on the dark page. */
  | { layout: "STAKES"; statement: string; body?: string; emphasis?: string; icon?: IconName }
  /** One point of the argument, numbered in order among the POINT slides. */
  | { layout: "POINT"; title: string; body?: string; emphasis?: string; icon?: IconName }
  /** One step of a sequence, with its place in the sequence drawn. */
  | { layout: "STEP"; title: string; body?: string; emphasis?: string; icon?: IconName }
  /** Common assumption against what happens in practice. */
  | { layout: "CONTRAST"; before: string; after: string; beforeLabel?: string; afterLabel?: string }
  | { layout: "CHECKLIST"; title: string; items: string[] }
  /** A figure the author's memory or approved proof states. Never invented. */
  | { layout: "NUMBER"; value: string; unit?: string; caption: string }
  /** The author's own words, from their memory. */
  | { layout: "QUOTE"; quote: string; attribution?: string }
  /** The takeaway, the author, and a soft save line. Always last. */
  | { layout: "CLOSE"; takeaway: string; saveLine?: string }
  /** 3 to 6 parallel things, each a tile with a line icon and a short label. */
  | { layout: "GRID"; title: string; items: { label: string; icon: IconName }[] }
  /** 3 or 4 short lines that land one after another (the last in the accent), then up to 4 checks. */
  | { layout: "PUNCH"; lines: string[]; checks: string[] };

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
/** The layouts that may carry an icon: the ones with room under a short statement or title. */
export const ICON_LAYOUTS: SlideLayout[] = ["STAKES", "POINT", "STEP"];
const ICON = 300;
const ICON_GAP = 48;
/** The headline keeps at least this share of the size it has without the icon: the icon never costs the words their weight. */
const ICON_KEEP = 0.85;
/** And never goes below these sizes beside an icon (px at 1080 wide, about a third of that on a phone). */
const ICON_FLOOR: Partial<Record<SlideLayout, number>> = { STAKES: 84, POINT: 76, STEP: 76 };

const CENTRE = SLIDE_SIZE.height - PAD * 2 - TOP_ROW - TOP_GAP - BOTTOM_GAP - TRACK - TRACK_GAP - NAME_ROW;
/** POSTER: the ribbon's lane between the centre and the name row, and the name row's height (the round swipe button). */
const LANE = 120;
const POSTER_NAME_ROW = 56;
const POSTER_CENTRE = SLIDE_SIZE.height - PAD * 2 - TOP_ROW - TOP_GAP - LANE - POSTER_NAME_ROW;
/** The ribbon's centre line, from the top of the page. */
const RIBBON_Y = PAD + TOP_ROW + TOP_GAP + POSTER_CENTRE + LANE / 2;

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
  brand: CoverBrand;
  /** The centre's full height in this style. */
  centre: number;
  /** Words in the paper colour on the ink. */
  dark: boolean;
  /** The height the words may use: the centre, less the icon's space when there is one. */
  room: number;
  /** The smallest the headline may be set on this page; smaller fails the fit. */
  mainMin?: number;
  /** Told the headline's fitted size. */
  onMain?: (size: number) => void;
  ink: string;
  paper: string;
  accent: string;
  /** The words start at the top, so a run of POINT or STEP pages lines up page to page, icon or not. */
  top?: boolean;
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

/** The icon, faint and bottom right: it supports the words, never competes with them. */
function iconSrc(name: IconName, page: Page): string {
  const { viewBox, body } = ICONS[name];
  const [colour, opacity] = page.style === "MINIMAL" ? [page.ink, 0.3] : [page.accent, 0.45];
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${ICON}" height="${ICON}"><g fill="${colour}" fill-opacity="${opacity}">${body}</g></svg>`);
}

function Frame({ deck, page, icon, children }: { deck: Deck; page: Page; icon?: IconName; children: ReactNode }) {
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

      {icon ? (
        <div style={{ height: page.centre, display: "flex", flexDirection: "column", marginBottom: BOTTOM_GAP }}>
          <div style={{ height: page.room, display: "flex", flexDirection: "column", justifyContent: page.top ? "flex-start" : "center" }}>{children}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: ICON_GAP }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc(icon, page)} width={ICON} height={ICON} alt="" />
          </div>
        </div>
      ) : (
        <div style={{ height: page.centre, display: "flex", flexDirection: "column", justifyContent: page.top ? "flex-start" : "center", marginBottom: BOTTOM_GAP }}>{children}</div>
      )}

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

/** The headline's fit, held to the page's minimum size. */
function mainFit(page: Page, f: Fitted): Fitted {
  page.onMain?.(f.size);
  if (page.mainMin && f.size < page.mainMin) throw new CoverFitError(`The headline would be set at ${f.size}px, below ${page.mainMin}px.`);
  return f;
}

const wordKey = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

/** Paper or ink, whichever reads better on `bg`. */
const onColour = (brand: CoverBrand, bg: string) => (contrast(brand.ink, bg) >= contrast(brand.paper, bg) ? brand.ink : brand.paper);

/**
 * Which words of each line sit on the highlighter: the emphasis phrase where
 * a line holds all of it, else (a phrase broken across lines) each of its
 * words of 3 letters or more.
 */
function marked(lines: string[], emphasis?: string): boolean[][] {
  const target = (emphasis ?? "").split(/\s+/).map(wordKey).filter(Boolean);
  const words = lines.map((l) => l.split(" "));
  const out = words.map((ws) => ws.map(() => false));
  if (!target.length) return out;
  let whole = false;
  words.forEach((ws, i) => {
    for (let a = 0; a + target.length <= ws.length; a++) {
      if (target.every((t, k) => wordKey(ws[a + k]) === t)) {
        whole = true;
        target.forEach((_, k) => (out[i][a + k] = true));
      }
    }
  });
  if (!whole) words.forEach((ws, i) => ws.forEach((w, j) => (out[i][j] = wordKey(w).length >= 3 && target.includes(wordKey(w)))));
  return out;
}

/**
 * POSTER's emphasis: the words on a solid accent block, like a highlighter.
 * The block's padding is taken back by margins, so every word advances
 * exactly as in Lines and the fitted breaks still hold.
 */
function MarkLines({ fitted, face, tracking = 0, lineHeight, color, emphasis, mark, onMark }: { fitted: Fitted; face: Face; tracking?: number; lineHeight: number; color: string; emphasis?: string; mark: string; onMark: string }) {
  const { size, lines } = fitted;
  const spacing = tracking * size;
  const space = textWidth(metricsFor(face), " ", size, spacing);
  const padX = Math.round(size * 0.12);
  const on = marked(lines, emphasis);
  return (
    <div style={{ display: "flex", flexDirection: "column", ...faceStyle(face), fontSize: size, lineHeight, letterSpacing: spacing, color }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", flexShrink: 0 }}>
          {line.split(" ").map((w, j, ws) => {
            if (!on[i][j]) return <div key={j} style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", marginRight: space }}>{w}</div>;
            const left = j > 0 && on[i][j - 1] ? 0 : padX;
            const right = j + 1 < ws.length && on[i][j + 1] ? space : padX;
            const first = left > 0;
            const last = right !== space;
            return (
              <div key={j} style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", background: mark, color: onMark, paddingLeft: left, paddingRight: right, marginLeft: -left, marginRight: space - right, borderTopLeftRadius: first ? 8 : 0, borderBottomLeftRadius: first ? 8 : 0, borderTopRightRadius: last ? 8 : 0, borderBottomRightRadius: last ? 8 : 0 }}>
                {w}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** A headline with its emphasis: in the accent colour, or on POSTER's highlighter block. */
function Words({ fitted, face, tracking, lineHeight, page, emphasis }: { fitted: Fitted; face: Face; tracking: number; lineHeight: number; page: Page; emphasis?: string }) {
  if (page.style === "POSTER" && emphasis) {
    return <MarkLines fitted={fitted} face={face} tracking={tracking} lineHeight={lineHeight} color={page.ink} emphasis={emphasis} mark={page.accent} onMark={onColour(page.brand, page.accent)} />;
  }
  return <Lines fitted={fitted} face={face} tracking={tracking} lineHeight={lineHeight} color={page.ink} emphasis={emphasis} accent={page.accent} />;
}

/** A title (serif) with an optional body line under it, sharing the height left by `reserved`. */
function TitleBody({ title, body, emphasis, page, reserved }: { title: string; body?: string; emphasis?: string; page: Page; reserved: number }) {
  const bodyFit = body ? fitOrThrow("body", body) : null;
  const bodyHeight = bodyFit ? 48 + height(bodyFit, LH.body) : 0;
  const titleFit = mainFit(page, fitOrThrow("title", title, page.room - reserved - bodyHeight, LH.title));
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Words fitted={titleFit} face="serif" tracking={-0.015} lineHeight={LH.title} page={page} emphasis={emphasis} />
      {bodyFit ? (
        <div style={{ display: "flex", marginTop: 48 }}>
          <Lines fitted={bodyFit} face="sans" lineHeight={LH.body} color={rgba(page.ink, 0.74)} />
        </div>
      ) : null}
    </div>
  );
}

const NUMERAL = 150;

/** POSTER: the numeral is the page's hero, set thin and huge. */
const GIANT_NUMERAL = 210;

function PointCentre({ slide, page, n }: { slide: Extract<Slide, { layout: "POINT" }>; page: Page; n: number }) {
  const giant = page.style === "POSTER";
  const size = giant ? GIANT_NUMERAL : NUMERAL;
  const height = giant ? Math.round(size * 0.8) : size;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-end", ...faceStyle(giant ? "sans" : "serifItalic"), fontSize: size, lineHeight: giant ? 0.8 : 1, height, letterSpacing: giant ? -0.05 * size : 0, marginBottom: 40, color: page.accent }}>{String(n).padStart(2, "0")}</div>
      {TitleBody({ title: slide.title, body: slide.body, emphasis: slide.emphasis, page, reserved: height + 40 })}
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
  const statement = mainFit(page, fitOrThrow("statement", slide.statement, page.room - bodyHeight - 62, LH.statement));
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ width: 120, height: 6, background: page.accent, marginBottom: 56 }} />
      <Words fitted={statement} face="serif" tracking={-0.02} lineHeight={LH.statement} page={page} emphasis={slide.emphasis} />
      {bodyFit ? (
        <div style={{ display: "flex", marginTop: 56 }}>
          <Lines fitted={bodyFit} face="sans" lineHeight={LH.body} color={rgba(page.ink, 0.74)} />
        </div>
      ) : null}
    </div>
  );
}

const PANEL = { pad: 44, gap: 28, radius: 28 } as const;

/** POSTER: the assumption on a muted panel, the practice on a solid accent block, so the two halves scan apart. */
function SplitContrast({ slide, page }: { slide: Extract<Slide, { layout: "CONTRAST" }>; page: Page }) {
  const tagHeight = 30 + 24;
  const half = (page.centre - PANEL.gap - PANEL.pad * 4 - tagHeight * 2) / 2;
  const inner = INNER - PANEL.pad * 2;
  const fitIn = (what: "before" | "after", text: string) => {
    const box = { ...BOX[what], maxWidth: inner, maxHeight: half, lineHeight: LH[what] };
    const f = fit(smartQuotes(text), SIZES[what][0], SIZES[what][1], box);
    if (!f) throw new CoverFitError(`The ${what} is too long for a slide: "${text.slice(0, 80)}"`);
    return balance(f, box);
  };
  const before = fitIn("before", slide.before);
  const after = fitIn("after", slide.after);
  const block = blockColour(page.brand);
  const onBlock = onColour(page.brand, block);
  const tag = (text: string, color: string) => (
    <div style={{ display: "flex", ...faceStyle("sansSemi"), fontSize: 26, lineHeight: 1.15, letterSpacing: 0.12 * 26, color, marginBottom: 24 }}>{text.toUpperCase()}</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", padding: PANEL.pad, borderRadius: PANEL.radius, background: rgba(page.ink, 0.07) }}>
        {tag(slide.beforeLabel || "Common assumption", rgba(page.ink, 0.55))}
        <Lines fitted={before} face="serifItalic" tracking={-0.01} lineHeight={LH.before} color={rgba(page.ink, 0.66)} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: PANEL.pad, borderRadius: PANEL.radius, background: block, marginTop: PANEL.gap }}>
        {tag(slide.afterLabel || "In practice", rgba(onBlock, 0.8))}
        <Lines fitted={after} face="serif" tracking={-0.015} lineHeight={LH.after} color={onBlock} />
      </div>
    </div>
  );
}

function ContrastCentre({ slide, page }: { slide: Extract<Slide, { layout: "CONTRAST" }>; page: Page }) {
  if (page.style === "POSTER") return SplitContrast({ slide, page });
  const labels = 2 * (30 + 28);
  const divider = 2 + 2 * 64;
  const half = (page.centre - labels - divider) / 2;
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
  const title = fitOrThrow("title", slide.title, page.centre - itemsHeight - 64, LH.title);
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
  const caption = fitOrThrow("caption", slide.caption, page.centre - value.size * 0.9 - 110, LH.caption);
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
  const quote = fitOrThrow("quote", slide.quote, page.centre - QUOTE_MARK - attributionHeight, LH.quote);
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
  const takeaway = fitOrThrow("takeaway", slide.takeaway, page.centre - card - saveHeight, LH.takeaway);
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

const TILE = { gap: 24, pad: 32, icon: 84, iconGap: 24, lineHeight: 1.2, radius: 26 } as const;

/** GRID: a title, then 3 to 6 tiles, each a line icon and a short label. */
function GridCentre({ slide, page }: { slide: Extract<Slide, { layout: "GRID" }>; page: Page }) {
  const items = slide.items.filter((x) => x.label.trim());
  if (items.length < 3 || items.length > 6) throw new CoverFitError(`A grid slide takes 3 to 6 tiles, not ${items.length}.`);
  const cols = items.length <= 4 ? 2 : 3;
  const tileWidth = Math.floor((INNER - TILE.gap * (cols - 1)) / cols);
  const box: TextBox = { face: "sansSemi", maxWidth: tileWidth - TILE.pad * 2, maxLines: 2 };
  // One size for every label, so the tiles read as a set.
  let labels: Fitted[] | null = null;
  for (let size = 46; size >= 32 && !labels; size -= 2) {
    const all = items.map((x) => fit(smartQuotes(x.label), size, size, box));
    if (all.every(Boolean)) labels = all as Fitted[];
  }
  if (!labels) throw new CoverFitError("A grid label is too long for a slide.");
  const lines = Math.max(...labels.map((f) => f.lines.length));
  const tileHeight = TILE.pad * 2 + TILE.icon + TILE.iconGap + lines * labels[0].size * TILE.lineHeight;
  const rowCount = Math.ceil(items.length / cols);
  const gridHeight = rowCount * tileHeight + (rowCount - 1) * TILE.gap;
  const title = fitOrThrow("title", slide.title, page.centre - gridHeight - 64, LH.title);
  const tile = page.style === "POSTER" ? rgba(page.ink, 0.07) : rgba(page.ink, 0.05);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines fitted={title} face="serif" tracking={-0.015} lineHeight={LH.title} color={page.ink} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
        {Array.from({ length: rowCount }, (_, r) => (
          <div key={r} style={{ display: "flex", marginTop: r ? TILE.gap : 0 }}>
            {items.slice(r * cols, r * cols + cols).map((item, c) => (
              <div key={c} style={{ display: "flex", flexDirection: "column", width: tileWidth, height: tileHeight, padding: TILE.pad, borderRadius: TILE.radius, marginLeft: c ? TILE.gap : 0, background: tile }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={solidIcon(item.icon, page.accent)} width={TILE.icon} height={TILE.icon} alt="" />
                <div style={{ display: "flex", marginTop: TILE.iconGap }}>
                  <Lines fitted={labels![r * cols + c]} face="sansSemi" lineHeight={TILE.lineHeight} color={page.ink} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A line icon in one solid colour. */
function solidIcon(name: IconName, colour: string): string {
  const { viewBox, body } = ICONS[name];
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="256" height="256"><g fill="${colour}">${body}</g></svg>`);
}

const PUNCH_CHECK = 48;

/** PUNCH: 3 or 4 short lines that land one after another, the last in the accent, then up to 4 ticked checks. */
function PunchCentre({ slide, page }: { slide: Extract<Slide, { layout: "PUNCH" }>; page: Page }) {
  const punch = slide.lines.map((l) => smartQuotes(l.trim())).filter(Boolean);
  const checks = slide.checks.map((c) => smartQuotes(c.trim())).filter(Boolean);
  if (punch.length < 3 || punch.length > 4) throw new CoverFitError(`A punch slide takes 3 or 4 lines, not ${punch.length}.`);
  if (checks.length > 4) throw new CoverFitError(`A punch slide takes at most 4 checks, not ${checks.length}.`);
  const checkBox: TextBox = { face: "sans", maxWidth: INNER - PUNCH_CHECK - 28, maxLines: 1 };
  let checkFits: Fitted[] = [];
  if (checks.length) {
    for (let size = 42; size >= 34 && !checkFits.length; size -= 2) {
      const all = checks.map((c) => fit(c, size, size, checkBox));
      if (all.every(Boolean)) checkFits = all as Fitted[];
    }
    if (!checkFits.length) throw new CoverFitError("A check is too long for a slide.");
  }
  const checksHeight = checks.length ? 64 + checks.length * Math.max(PUNCH_CHECK, checkFits[0].size * 1.3) + (checks.length - 1) * 18 : 0;
  const lineBox: TextBox = { face: "serif", maxWidth: INNER, maxLines: 1, tracking: -0.02 };
  let fitted: Fitted[] | null = null;
  for (let size = 130; size >= 64 && !fitted; size -= 2) {
    const all = punch.map((l) => fit(l, size, size, lineBox));
    if (all.every(Boolean) && punch.length * size * 1.08 <= page.centre - checksHeight) fitted = all as Fitted[];
  }
  if (!fitted) throw new CoverFitError("The punch lines do not fit a slide.");
  const last = punch.length - 1;
  const tickColour = page.style === "POSTER" ? page.accent : page.brand.secondary;
  const tick = svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="24" fill="${page.dark ? page.accent : tickColour}"/><path d="M14 25 l7 7 l13 -15" fill="none" stroke="${onColour(page.brand, page.dark ? page.accent : tickColour)}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {fitted.map((f, i) =>
        i === last && page.style === "POSTER" ? (
          <MarkLines key={i} fitted={f} face="serif" tracking={-0.02} lineHeight={1.08} color={page.ink} emphasis={f.lines[0]} mark={page.accent} onMark={onColour(page.brand, page.accent)} />
        ) : (
          <Lines key={i} fitted={f} face="serif" tracking={-0.02} lineHeight={1.08} color={i === last ? page.accent : page.ink} />
        ),
      )}
      {checks.length ? (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
          {checkFits.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginTop: i ? 18 : 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tick} width={PUNCH_CHECK} height={PUNCH_CHECK} style={{ marginRight: 28 }} alt="" />
              <Lines fitted={f} face="sans" lineHeight={1.3} color={page.ink} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** An eight-spoke asterisk, the POSTER deck's mark. */
const asterisk = (colour: string, size: number) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" width="${size}" height="${size}">${Array.from({ length: 4 }, (_, i) => `<rect x="-7" y="-50" width="14" height="100" rx="7" fill="${colour}" transform="rotate(${i * 45})"/>`).join("")}</svg>`);

/** The ribbon's height at x on the deck-wide drawing: two waves a page, the swing alternating so it reads hand-drawn. */
function ribbonY(x: number): number {
  const page = Math.floor(x / SLIDE_SIZE.width);
  const amp = page % 2 ? 30 : 22;
  return RIBBON_Y + amp * Math.sin((2 * Math.PI * x) / (SLIDE_SIZE.width / 2) + 0.6);
}

/**
 * POSTER's background: one drawing the width of the whole deck, of which each
 * page shows its own slice, so swiping moves along one piece. Glows sit on the
 * seams and so cross from page to page; the ribbon runs from page 2 to the
 * last page's middle, with a node where each page's words begin. Nothing
 * crosses the words: the glows are faint and the ribbon has its own lane.
 */
function panoramaSlice(page: Page, deckBrand: CoverBrand): string {
  const W = SLIDE_SIZE.width;
  const H = SLIDE_SIZE.height;
  const x0 = page.index * W;
  const glows = Array.from({ length: page.total - 1 }, (_, k) => k + 1)
    .map((k) => `<circle cx="${k * W}" cy="${k % 2 ? 300 : 960}" r="250" fill="${k % 2 ? deckBrand.accent : deckBrand.secondary}" fill-opacity="${k % 2 ? 0.3 : 0.22}"/>`)
    .join("");
  const start = W - 20;
  const end = (page.total - 1) * W + W / 2;
  const pts: string[] = [];
  for (let x = start; x <= end; x += 12) pts.push(`${x.toFixed(0)},${ribbonY(x).toFixed(1)}`);
  const nodes = Array.from({ length: page.total - 1 }, (_, k) => k + 1)
    .map((i) => {
      const x = i * W + PAD + 18;
      const fill = i % 2 ? deckBrand.ink : deckBrand.paper;
      return `<circle cx="${x}" cy="${ribbonY(x).toFixed(1)}" r="22" fill="${fill}" stroke="${deckBrand.accent}" stroke-width="9"/>`;
    })
    .join("");
  const tip = `<circle cx="${end}" cy="${ribbonY(end).toFixed(1)}" r="30" fill="${deckBrand.accent}"/>`;
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${x0} 0 ${W} ${H}">
    <defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="110"/></filter></defs>
    <g filter="url(#g)">${glows}</g>
    <polyline points="${pts.join(" ")}" fill="none" stroke="${deckBrand.accent}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
    ${nodes}${tip}</svg>`);
}

/** The round swipe button. */
const swipeButton = (fill: string, arrowColour: string) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="${fill}"/><path d="M17 28 H38 M30 19 L39 28 L30 37" fill="none" stroke="${arrowColour}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

/** POSTER's frame: the deck-wide drawing behind, the asterisk and label, a faint giant word on a STAKES page, the round swipe button. */
function PosterFrame({ deck, page, icon, ghost, children }: { deck: Deck; page: Page; icon?: IconName; ghost?: string; children: ReactNode }) {
  const { ink, paper, accent, index, total } = page;
  const label = fitOrThrow("chrome", deck.label.toUpperCase());
  const marker = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const markerWidth = textWidth(metricsFor("sansSemi"), marker, 26, 0.12 * 26);
  const name = fitOrThrow("chrome", deck.author.name);
  const last = index === total - 1;
  const x0 = index * SLIDE_SIZE.width;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: paper, padding: PAD, position: "relative", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={panoramaSlice(page, deck.brand)} data-slice={String(x0)} width={SLIDE_SIZE.width} height={SLIDE_SIZE.height} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      {ghost ? (
        // Low and bleeding off the page, in the ribbon's lane and under the last lines: depth, never a second headline.
        <div style={{ position: "absolute", left: PAD + 120, top: 1000, display: "flex", whiteSpace: "nowrap", ...faceStyle("serif"), fontSize: 380, lineHeight: 1, letterSpacing: -0.04 * 380, color: rgba(ink, 0.045) }}>{ghost}</div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: TOP_ROW, marginBottom: TOP_GAP }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asterisk(accent, 34)} width={34} height={34} style={{ marginRight: 18 }} alt="" />
          <Lines fitted={label} face="sansSemi" tracking={0.12} lineHeight={1} color={rgba(ink, 0.72)} />
        </div>
        <div style={{ display: "flex", width: markerWidth + 4, ...faceStyle("sansSemi"), fontSize: 26, letterSpacing: 0.12 * 26, color: rgba(ink, 0.5) }}>{marker}</div>
      </div>

      {icon ? (
        <div style={{ height: page.centre, display: "flex", flexDirection: "column" }}>
          <div style={{ height: page.room, display: "flex", flexDirection: "column", justifyContent: page.top ? "flex-start" : "center" }}>{children}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: ICON_GAP }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc(icon, page)} width={ICON} height={ICON} alt="" />
          </div>
        </div>
      ) : (
        <div style={{ height: page.centre, display: "flex", flexDirection: "column", justifyContent: page.top ? "flex-start" : "center" }}>{children}</div>
      )}

      <div style={{ height: LANE, display: "flex" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: POSTER_NAME_ROW }}>
        {last ? <div style={{ display: "flex" }} /> : <Lines fitted={name} face="sansSemi" tracking={0.12} lineHeight={1} color={rgba(ink, 0.62)} />}
        {last ? null : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={swipeButton(accent, onColour(page.brand, accent))} width={56} height={56} alt="" />
        )}
      </div>
    </div>
  );
}

/** The word a STAKES page carries faint and huge behind it: the emphasis, else the statement's longest word. */
function ghostWord(slide: Slide): string | undefined {
  if (slide.layout !== "STAKES") return undefined;
  const words = (slide.emphasis || slide.statement).split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, ""));
  return words.sort((a, b) => b.length - a.length)[0]?.toLowerCase() || undefined;
}

/** EDITORIAL puts STAKES and CLOSE on the dark page: they bracket the argument, and give the deck rhythm. */
const DARK: SlideLayout[] = ["STAKES", "CLOSE"];

function isDark(style: SlideStyle, layout: SlideLayout, index: number): boolean {
  // POSTER takes turns, opening dark on page 2.
  if (style === "POSTER") return index % 2 === 1;
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
  const dark = isDark(style, slide.layout, i);
  const centre = style === "POSTER" ? POSTER_CENTRE : CENTRE;
  const base = {
    style,
    brand,
    centre,
    dark,
    ink: dark ? brand.paper : brand.ink,
    paper: dark ? brand.ink : brand.paper,
    accent: dark ? brand.accentOnInk : brand.accent,
    top: slide.layout === "POINT" || slide.layout === "STEP",
    index: i,
    total: deck.slides.length + 1,
  };
  // Numbered in order among slides of the same layout, so POINT 1, 2, 3 and STEP 1 of 3 stay right after a reorder.
  const same = deck.slides.filter((s) => s.layout === slide.layout);
  const n = deck.slides.slice(0, i).filter((s) => s.layout === slide.layout).length;
  // Called as functions, not rendered as components, so every fit runs now.
  const draw = (page: Page) =>
    slide.layout === "STAKES" ? StakesCentre({ slide, page })
    : slide.layout === "POINT" ? PointCentre({ slide, page, n })
    : slide.layout === "STEP" ? StepCentre({ slide, page, n, of: same.length })
    : slide.layout === "CONTRAST" ? ContrastCentre({ slide, page })
    : slide.layout === "CHECKLIST" ? ChecklistCentre({ slide, page })
    : slide.layout === "NUMBER" ? NumberCentre({ slide, page, secondary: dark || style === "POSTER" ? page.accent : brand.secondary })
    : slide.layout === "QUOTE" ? QuoteCentre({ slide, page })
    : slide.layout === "GRID" ? GridCentre({ slide, page })
    : slide.layout === "PUNCH" ? PunchCentre({ slide, page })
    : CloseCentre({ slide, page, deck });
  const icon = "icon" in slide && slide.icon && slide.icon in ICONS ? slide.icon : undefined;
  // Without the icon first: the words must fit at all, and their size there sets how much the icon may take.
  let full = 0;
  const plain: Page = { ...base, room: centre, onMain: (size) => (full = size) };
  const words = draw(plain);
  const frame = (page: Page, children: ReactNode, withIcon?: IconName) =>
    style === "POSTER" ? PosterFrame({ deck, page, icon: withIcon, ghost: ghostWord(slide), children }) : Frame({ deck, page, icon: withIcon, children });
  if (icon) {
    const page: Page = { ...base, room: centre - ICON - ICON_GAP, mainMin: Math.max(ICON_FLOOR[slide.layout] ?? 0, Math.ceil(full * ICON_KEEP)) };
    try {
      return frame(page, draw(page), icon);
    } catch (e) {
      // The words win: without the icon they get the whole centre at full size.
      if (!(e instanceof CoverFitError)) throw e;
    }
  }
  return frame(plain, words);
}
