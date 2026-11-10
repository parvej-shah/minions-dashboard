/**
 * Editorial cover layouts (phase 5 of docs/product/authority-flywheel-plan.md).
 * Every letter on a cover is drawn here, never by an image model. Every
 * poster type keeps the same type, the audience chip and the author's
 * signature, so a reader still recognises the author; each type has its own
 * background (backgrounds.ts), so a run of posts looks different post to post
 * (DECISIONS.md, 2026-11-09).
 *
 * Portrait 1080x1350: the most feed height LinkedIn gives a single image on
 * mobile. Satori draws it (next/og): flexbox only, no grid, and no automatic
 * shrink-to-fit, so fit.ts sets every size and line break first.
 */
import type { ReactNode } from "react";
import { faceStyle, metricsFor, type Face } from "./fonts";
import { balance, fit, type Fitted, type TextBox } from "./fit";
import { textWidth } from "./metrics";
import { drawArt, type ArtChoice } from "./art";
import { ICONS, type IconName } from "./icons";
import { BANNER_DESIGNS, isBanner } from "./bannerTypes";
import { bannerElement } from "./modern";
import { tagsFor } from "./social";
import { BACKGROUND_FOR, BLOCK_TOP, DARK_BACKGROUNDS, backgroundSrc, brandOn } from "./backgrounds";

export const COVER_SIZE = { width: 1080, height: 1350 } as const;
export const PAD = 88;
export const INNER = COVER_SIZE.width - PAD * 2;
/** The author's photo or monogram, in px. */
const AVATAR = 120;
/**
 * The height between the top padding and the signature: less the label row
 * and its gap when there is a label, the gap above the divider, the divider
 * (2 + 40) and the signature.
 */
const centreHeight = (spec: { label?: string; layout?: CoverLayout }) =>
  COVER_SIZE.height - PAD * 2 - (spec.label ? CHIP_HEIGHT + 48 : 0) - 48 - 42 - AVATAR - (spec.layout && BACKGROUND_FOR[spec.layout] === "BLOCK" ? BLOCK_RESERVE : 0);
/** The audience chip's height. */
const CHIP_HEIGHT = 56;
/** BLOCK: the band rises above the divider on the right, so the centre ends this much higher. */
const BLOCK_RESERVE = 1100 - BLOCK_TOP.right + 24;

export const COVER_LAYOUTS = ["HEADLINE", "STATEMENT", "QUOTE", "NUMBER", "LIST", "GRID", "PUNCH", "PHOTO", ...BANNER_DESIGNS] as const;
export type CoverLayout = (typeof COVER_LAYOUTS)[number];

export interface CoverBrand {
  ink: string;
  paper: string;
  /** Emphasis: one word of the headline, the quote mark, the label bar. Reads on paper. */
  accent: string;
  /** The same accent for the dark STATEMENT layout. Reads on ink. */
  accentOnInk: string;
  /** The number, the monogram. */
  secondary: string;
}

export interface CoverAuthor {
  name: string;
  role?: string;
  /** A data: URL or an https URL we host. Missing: an initials monogram. */
  photo?: string;
}

export interface CoverSpec {
  layout: CoverLayout;
  /** Who it is for, e.g. "For real estate teams". Readers stop for posts aimed at them. */
  label?: string;
  headline: string;
  /** One word of the headline to set in the accent colour. */
  emphasis?: string;
  kicker?: string;
  /** QUOTE: a sentence that appears word for word in the body. */
  quote?: string;
  /** NUMBER: a figure that is a verified claim in the draft. */
  number?: { value: string; unit?: string };
  author: CoverAuthor;
  brand: CoverBrand;
  /** HEADLINE and STATEMENT: an illustration above the headline (src/lib/covers/art.ts). */
  art?: { choice: ArtChoice; seed: string };
  /** LIST: 3-4 points the post makes (shape.ts). */
  list?: string[];
  /** GRID: 3-6 parallel things, each with a line icon. */
  grid?: { label: string; icon: IconName }[];
  /** PUNCH: 3-4 short lines, then 3-4 checks. */
  punch?: { lines: string[]; checks: string[] };
  /** CUTOUT: the author's photo with a transparent background, trimmed to the person, as a data URL. */
  cutout?: { src: string; width: number; height: number };
  /** Set by coverElement: the brand the background is drawn in, before the accent was tuned to read on it. */
  backdropBrand?: CoverBrand;
  /**
   * The last resort when no honest headline sets in HEADLINE_LINES: one more
   * line, so the draft still gets a cover. Never set on a first attempt.
   */
  looseHeadline?: boolean;
}

export class CoverFitError extends Error {}

/**
 * A cover is read in about a second at feed size, so its main line sets in at
 * most three lines: past that the eye reads a paragraph, not a headline.
 */
export const HEADLINE_LINES = 3;

/** Bricolage's ExtraBold is already tightly spaced; negative tracking made letters touch. */
const HEAD_TRACKING = 0;

// Every text box on the cover. Sizes are px on the 1080-wide canvas, which a
// phone feed shows about 360 wide (a third): the smallest (30) is about 10px
// there, the floor for a secondary line; a headline is never under 24px.
const BOX = {
  label: { face: "sansSemi", maxWidth: INNER - 64, maxLines: 1, tracking: 0.12 },
  headline: { face: "serif", maxWidth: INNER, maxLines: HEADLINE_LINES, tracking: HEAD_TRACKING },
  kicker: { face: "sans", maxWidth: INNER, maxLines: 2 },
  quote: { face: "serifItalic", maxWidth: INNER, maxLines: 4, tracking: HEAD_TRACKING },
  numberHeadline: { face: "serif", maxWidth: INNER, maxLines: HEADLINE_LINES, tracking: HEAD_TRACKING },
  name: { face: "sansSemi", maxWidth: INNER - AVATAR - 28, maxLines: 1 },
  role: { face: "sans", maxWidth: INNER - AVATAR - 28, maxLines: 2 },
  /** LIST, GRID: the headline above the rows or tiles. */
  posterHeadline: { face: "serif", maxWidth: INNER, maxLines: HEADLINE_LINES, tracking: HEAD_TRACKING },
  /** PUNCH: the headline as a lead-in above the punch lines. */
  lead: { face: "sansSemi", maxWidth: INNER, maxLines: 2 },
  /** PHOTO: the headline under the photo. */
  photoHeadline: { face: "serif", maxWidth: INNER, maxLines: HEADLINE_LINES, tracking: HEAD_TRACKING },
} satisfies Record<string, TextBox>;

const SIZES: Record<keyof typeof BOX, readonly [number, number]> = {
  label: [30, 34],
  headline: [72, 150],
  kicker: [36, 44],
  quote: [60, 124],
  numberHeadline: [60, 84],
  name: [40, 46],
  role: [30, 34],
  posterHeadline: [56, 100],
  lead: [34, 42],
  photoHeadline: [64, 112],
};

/** True when the headline sets in `lines` (HEADLINE_LINES by default) at a size that reads at feed width. */
export function headlineFits(text: string, minSize = 80, lines: number = HEADLINE_LINES): boolean {
  return fit(text, minSize, SIZES.headline[1], { ...BOX.headline, maxLines: lines }) !== null;
}

function fitOrThrow(what: keyof typeof BOX, text: string, height?: { maxHeight: number; lineHeight: number }, extraLines = 0): Fitted {
  const [min, max] = SIZES[what];
  const box = { ...BOX[what], ...height, maxLines: BOX[what].maxLines + extraLines };
  const f = fit(text, min, max, box);
  if (!f) throw new CoverFitError(`The ${what} is too long for this cover: "${text.slice(0, 80)}"`);
  return balance(f, box);
}

export function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const wordKey = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * Draws fitted lines exactly as fit.ts broke them. Each word is its own item,
 * spaced by the font's real space width, so one can carry the accent colour;
 * nowrap stops Satori breaking a hyphenated word inside its item.
 */
/**
 * Lines as fit.ts broke them; the emphasis word in the accent, and in
 * `emphasisFace` when given. That face must be no wider than `face` (the
 * Instrument italic is far narrower than the bold faces), since the lines
 * were measured in `face`.
 */
export function Lines({ fitted, face, tracking = 0, lineHeight, color, emphasis, accent, emphasisFace }: { fitted: Fitted; face: Face; tracking?: number; lineHeight: number; color: string; emphasis?: string; accent?: string; emphasisFace?: Face }) {
  const { size, lines } = fitted;
  const spacing = tracking * size;
  const space = textWidth(metricsFor(face), " ", size, spacing);
  const target = emphasis ? wordKey(emphasis) : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", ...faceStyle(face), fontSize: size, lineHeight, letterSpacing: spacing, color }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", flexShrink: 0 }}>
          {line.split(" ").map((w, j) => (
            <div key={j} style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", marginRight: space, color: target && accent && wordKey(w) === target ? accent : color, ...(target && emphasisFace && wordKey(w) === target ? { ...faceStyle(emphasisFace), letterSpacing: 0 } : {}) }}>
              {w}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The audience chip: the label on a soft tint of the accent, with an accent dot. */
function Chip({ text, ink, accent }: { text: Fitted; ink: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignSelf: "flex-start", alignItems: "center", height: CHIP_HEIGHT, padding: "0 26px", borderRadius: CHIP_HEIGHT / 2, background: rgba(accent, 0.13) }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: accent, marginRight: 16 }} />
      <Lines fitted={text} face="sansSemi" tracking={0.12} lineHeight={1} color={rgba(ink, 0.82)} />
    </div>
  );
}

/** The full-bleed background of a layout, drawn under everything else. */
function Backdrop({ spec }: { spec: CoverSpec }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={backgroundSrc(BACKGROUND_FOR[spec.layout], spec.backdropBrand ?? spec.brand)} width={COVER_SIZE.width} height={COVER_SIZE.height} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
  );
}

function Avatar({ author, brand, ring }: { author: CoverAuthor; brand: CoverBrand; ring?: string }) {
  const border = ring ? { border: `4px solid ${ring}` } : {};
  return author.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={author.photo} width={AVATAR} height={AVATAR} style={{ borderRadius: AVATAR / 2, objectFit: "cover", ...border }} alt="" />
  ) : (
    <div style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, background: brand.secondary, color: brand.paper, display: "flex", alignItems: "center", justifyContent: "center", ...faceStyle("sansBold"), fontSize: 44, ...border }}>
      {initials(author.name)}
    </div>
  );
}

function Signature({ author, color, muted }: { author: CoverAuthor; color: string; muted: string }) {
  const name = fitOrThrow("name", author.name);
  // A byline too long to read at feed size is left off rather than costing the cover.
  const role = author.role ? fit(author.role, SIZES.role[0], SIZES.role[1], BOX.role) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
      <Lines fitted={name} face="sansSemi" lineHeight={1.2} color={color} />
      {role ? (
        <div style={{ display: "flex", marginTop: 4 }}>
          <Lines fitted={role} face="sans" lineHeight={1.3} color={muted} />
        </div>
      ) : null}
    </div>
  );
}

function Frame({ spec, paper, ink, children }: { spec: CoverSpec; paper: string; ink: string; children: ReactNode }) {
  const { author, brand } = spec;
  const label = spec.label ? fitOrThrow("label", spec.label.toUpperCase()) : null;
  // On a colour block the author line sits on the band, in the paper colour.
  const onBand = BACKGROUND_FOR[spec.layout] === "BLOCK";
  const footInk = onBand ? brand.paper : ink;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: paper }}>
      <Backdrop spec={spec} />
      <div style={{ position: "absolute", left: 0, top: 0, width: COVER_SIZE.width, height: COVER_SIZE.height, display: "flex", flexDirection: "column", padding: PAD }}>
        {label ? (
          <div style={{ display: "flex", marginBottom: 48 }}>
            <Chip text={label} ink={ink} accent={brand.accent} />
          </div>
        ) : null}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: 48 + (onBand ? BLOCK_RESERVE : 0) }}>{children}</div>

        <div style={{ height: 2, background: onBand ? "transparent" : rgba(ink, 0.14), marginBottom: 40 }} />
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar author={author} brand={onBand ? { ...brand, secondary: brand.ink } : brand} ring={onBand ? brand.paper : undefined} />
          <Signature author={author} color={footInk} muted={rgba(footInk, onBand ? 0.86 : 0.66)} />
        </div>
      </div>
    </div>
  );
}

const KICKER_GAP = 48;
/**
 * The illustration takes the height the text leaves, between these bounds,
 * so a short headline gets a large picture and a long one a smaller picture,
 * never a gap. A doodle is a figure and needs more height to read at feed size.
 */
const ART_MIN = { SHAPES: 220, DOODLES: 260, ICONS: 220 } as const;
/** With art the headline is capped below its usual 150px, so the picture gets room and neither shouts over the other. */
const ART_HEADLINE_MAX = 128;
const ART_MAX = 440;
const ART_GAP = 64;

function Art({ spec, ink, paper, maxHeight }: { spec: CoverSpec; ink: string; paper: string; maxHeight: number }) {
  if (!spec.art) return null;
  const dark = spec.layout === "STATEMENT";
  const { src, aspect } = drawArt(spec.art.choice, spec.art.seed, {
    main: dark ? rgba(ink, 0.82) : spec.brand.secondary,
    highlight: spec.brand.accent,
    bg: paper,
    ink,
  });
  // As tall as the space allows, as long as it stays within the text column.
  const width = Math.min(INNER, Math.round(maxHeight * aspect));
  return (
    <div style={{ display: "flex" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={width} height={Math.round(width / aspect)} alt="" />
    </div>
  );
}
const QUOTE_MARK_HEIGHT = 150;

/** The opening quote mark as a drawn shape: two rounded drops, which a heavy sans glyph renders as blocks. */
const quoteMark = (colour: string) =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90"><g fill="${colour}"><circle cx="28" cy="62" r="27"/><path d="M2 60C2 28 20 8 48 0L55 14C38 22 31 36 30 52Z"/><circle cx="92" cy="62" r="27"/><path d="M66 60C66 28 84 8 112 0L119 14C102 22 95 36 94 52Z"/></g></svg>`).toString("base64")}`;

function HeadlineCentre({ spec, ink, paper }: { spec: CoverSpec; ink: string; paper: string }) {
  // The kicker is fitted first; the headline gets the height that is left.
  const kicker = spec.kicker ? fitOrThrow("kicker", spec.kicker) : null;
  const kickerHeight = kicker ? KICKER_GAP + kicker.lines.length * kicker.size * 1.35 : 0;
  const height = centreHeight(spec);
  const artMin = spec.art ? ART_MIN[spec.art.choice.style] + ART_GAP : 0;
  const artBox = { ...BOX.headline, maxHeight: height - kickerHeight - artMin, lineHeight: 1.05 };
  const artFit = spec.art ? fit(spec.headline, SIZES.headline[0], ART_HEADLINE_MAX, artBox) : null;
  const headline = spec.art ? artFit && balance(artFit, artBox) : fitOrThrow("headline", spec.headline, { maxHeight: height - kickerHeight, lineHeight: 1.05 }, spec.looseHeadline ? 1 : 0);
  if (!headline) throw new CoverFitError(`The headline does not fit beside the illustration: "${spec.headline.slice(0, 80)}"`);
  // No size floor beside the art: the headline is held to three lines either
  // way, so leaving the picture off would only leave the space empty.
  const textHeight = headline.lines.length * headline.size * 1.05 + kickerHeight;
  const text = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines fitted={headline} face="serif" tracking={HEAD_TRACKING} lineHeight={1.05} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
      {kicker ? (
        <div style={{ display: "flex", marginTop: KICKER_GAP }}>
          <Lines fitted={kicker} face="sans" lineHeight={1.35} color={rgba(ink, 0.72)} />
        </div>
      ) : null}
    </div>
  );
  if (!spec.art) return text;
  // Picture then words, one block with one fixed gap, centred in the space.
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {Art({ spec, ink, paper, maxHeight: Math.min(ART_MAX, height - textHeight - ART_GAP) })}
      <div style={{ display: "flex", marginTop: ART_GAP }}>{text}</div>
    </div>
  );
}

function QuoteCentre({ spec, ink }: { spec: CoverSpec; ink: string }) {
  const quote = fitOrThrow("quote", spec.quote || spec.headline, { maxHeight: centreHeight(spec) - QUOTE_MARK_HEIGHT, lineHeight: 1.18 });
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", height: QUOTE_MARK_HEIGHT, alignItems: "flex-start" }}>
        <img src={quoteMark(spec.brand.accent)} width={120} height={90} alt="" />
      </div>
      <Lines fitted={quote} face="serifItalic" tracking={HEAD_TRACKING} lineHeight={1.18} color={ink} />
    </div>
  );
}

const UNIT_SIZE = 72;

function NumberCentre({ spec, ink }: { spec: CoverSpec; ink: string }) {
  const n = spec.number ?? { value: "" };
  const unitWidth = n.unit ? textWidth(metricsFor("serifItalic"), n.unit, UNIT_SIZE) + 24 : 0;
  const value = fit(n.value, 160, 380, { face: "sansBold", maxWidth: INNER - unitWidth, maxLines: 1, tracking: -0.025 });
  if (!value || !n.value.trim()) throw new CoverFitError(`The number does not fit this cover: "${n.value}"`);
  const headline = fitOrThrow("numberHeadline", spec.headline, { maxHeight: centreHeight(spec) - value.size * 0.9 - 110, lineHeight: 1.1 });
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div style={{ display: "flex", ...faceStyle("sansBold"), fontSize: value.size, lineHeight: 0.9, letterSpacing: -0.025 * value.size, color: spec.brand.secondary }}>{n.value}</div>
        {n.unit ? <div style={{ display: "flex", ...faceStyle("serifItalic"), fontSize: UNIT_SIZE, marginLeft: 24, marginBottom: value.size * 0.06, color: ink }}>{n.unit}</div> : null}
      </div>
      <div style={{ height: 6, width: 120, background: spec.brand.accent, marginTop: 56, marginBottom: 48 }} />
      <Lines fitted={headline} face="serif" tracking={HEAD_TRACKING} lineHeight={1.1} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
    </div>
  );
}

/** A line icon as a data URL, filled in one colour. */
function iconSrc(name: IconName, colour: string): string {
  const { viewBox, body } = ICONS[name];
  return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="256" height="256"><g fill="${colour}">${body}</g></svg>`).toString("base64")}`;
}

/** The one size, from max down to min, at which every text fits its box; null when none does. */
function commonSize(texts: string[], min: number, max: number, box: TextBox, step = 2): { size: number; fitted: Fitted[] } | null {
  for (let size = max; size >= min; size -= step) {
    const fitted = texts.map((t) => fit(t, size, size, box));
    if (fitted.every(Boolean)) return { size, fitted: fitted as Fitted[] };
  }
  return null;
}

/** A light card on a light background: rows of a list, tiles of a grid. */
const card = (spec: CoverSpec, ink: string) => ({
  background: rgba(spec.brand.paper, 0.86),
  border: `2px solid ${rgba(ink, 0.08)}`,
  boxShadow: `0 8px 24px ${rgba(ink, 0.07)}`,
});

const POSTER_GAP = 52;
const ROW = { pad: 26, gap: 18, badge: 64, lineHeight: 1.25 } as const;

/** LIST: the headline, then the post's 3-4 points as numbered rows. */
function ListCentre({ spec, ink }: { spec: CoverSpec; ink: string }) {
  const items = spec.list ?? [];
  if (items.length < 3) throw new CoverFitError("A list cover needs 3 or 4 points.");
  const box: TextBox = { face: "sans", maxWidth: INNER - ROW.pad * 2 - ROW.badge - 28, maxLines: 2 };
  const rows = commonSize(items, 32, 42, box);
  if (!rows) throw new CoverFitError(`A list point is too long for this cover: "${items.find((i) => !fit(i, 32, 32, box))?.slice(0, 60)}"`);
  const rowHeight = (f: Fitted) => Math.max(ROW.badge, f.lines.length * rows.size * ROW.lineHeight) + ROW.pad * 2;
  const rowsHeight = rows.fitted.reduce((h, f) => h + rowHeight(f), 0) + ROW.gap * (items.length - 1);
  const headline = fitOrThrow("posterHeadline", spec.headline, { maxHeight: centreHeight(spec) - rowsHeight - POSTER_GAP, lineHeight: 1.06 });
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines fitted={headline} face="serif" tracking={HEAD_TRACKING} lineHeight={1.06} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: POSTER_GAP }}>
        {rows.fitted.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: ROW.pad, borderRadius: 22, marginTop: i ? ROW.gap : 0, ...card(spec, ink) }}>
            <div style={{ width: ROW.badge, height: ROW.badge, borderRadius: ROW.badge / 2, border: `3px solid ${spec.brand.accent}`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 28, color: spec.brand.accent, ...faceStyle("sansSemi"), fontSize: 26, flexShrink: 0 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <Lines fitted={f} face="sans" lineHeight={ROW.lineHeight} color={ink} />
          </div>
        ))}
      </div>
    </div>
  );
}

const TILE = { gap: 24, pad: 30, icon: 88, iconGap: 22, lineHeight: 1.2 } as const;

/** GRID: the headline, then 3-6 tiles, each a line icon and a short label. */
function GridCentre({ spec, ink }: { spec: CoverSpec; ink: string }) {
  const items = spec.grid ?? [];
  if (items.length < 3) throw new CoverFitError("A grid cover needs 3 to 6 items.");
  const cols = items.length === 4 ? 2 : 3;
  const tileWidth = Math.floor((INNER - TILE.gap * (cols - 1)) / cols);
  const box: TextBox = { face: "sansSemi", maxWidth: tileWidth - TILE.pad * 2, maxLines: 2 };
  const labels = commonSize(items.map((i) => i.label), 28, 38, box);
  if (!labels) throw new CoverFitError("A grid label is too long for this cover.");
  const lines = Math.max(...labels.fitted.map((f) => f.lines.length));
  const tileHeight = TILE.pad * 2 + TILE.icon + TILE.iconGap + lines * labels.size * TILE.lineHeight;
  const rowCount = Math.ceil(items.length / cols);
  const gridHeight = rowCount * tileHeight + (rowCount - 1) * TILE.gap;
  const headline = fitOrThrow("posterHeadline", spec.headline, { maxHeight: centreHeight(spec) - gridHeight - POSTER_GAP, lineHeight: 1.06 });
  const rows = Array.from({ length: rowCount }, (_, r) => items.slice(r * cols, r * cols + cols).map((item, c) => ({ item, fitted: labels.fitted[r * cols + c] })));
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines fitted={headline} face="serif" tracking={HEAD_TRACKING} lineHeight={1.06} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: POSTER_GAP }}>
        {rows.map((row, r) => (
          <div key={r} style={{ display: "flex", marginTop: r ? TILE.gap : 0 }}>
            {row.map(({ item, fitted }, c) => (
              <div key={c} style={{ display: "flex", flexDirection: "column", width: tileWidth, height: tileHeight, padding: TILE.pad, borderRadius: 26, marginLeft: c ? TILE.gap : 0, ...card(spec, ink) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc(item.icon, spec.brand.secondary)} width={TILE.icon} height={TILE.icon} alt="" />
                <div style={{ display: "flex", marginTop: TILE.iconGap }}>
                  <Lines fitted={fitted} face="sansSemi" lineHeight={TILE.lineHeight} color={ink} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const CHECK = 46;
const tick = (colour: string) =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path d="M6 12.5l4 4 8-9" fill="none" stroke="${colour}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`).toString("base64")}`;

/** PUNCH: the headline as a lead-in, 3-4 short lines (the last in the accent), then ticked checks. */
function PunchCentre({ spec, ink }: { spec: CoverSpec; ink: string }) {
  const punch = spec.punch;
  if (!punch || punch.lines.length < 3) throw new CoverFitError("A punch cover needs 3 or 4 lines.");
  const lead = fitOrThrow("lead", spec.headline);
  const leadHeight = lead.lines.length * lead.size * 1.25 + 36;
  const checkBox: TextBox = { face: "sans", maxWidth: INNER - CHECK - 24, maxLines: 1 };
  const checks = commonSize(punch.checks, 30, 38, checkBox);
  if (!checks) throw new CoverFitError("A check is too long for this cover.");
  const checksHeight = 44 + punch.checks.length * Math.max(CHECK, checks.size * 1.3) + (punch.checks.length - 1) * 14;
  const room = centreHeight(spec) - leadHeight - checksHeight;
  const lineBox: TextBox = { face: "serif", maxWidth: INNER, maxLines: 1, tracking: HEAD_TRACKING };
  let lines: ReturnType<typeof commonSize> = null;
  for (let size = 120; size >= 64 && !lines; size -= 2) {
    const all = commonSize(punch.lines, size, size, lineBox);
    if (all && punch.lines.length * size * 1.04 <= room) lines = all;
  }
  if (!lines) throw new CoverFitError("The punch lines do not fit this cover.");
  const last = punch.lines.length - 1;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", marginBottom: 36 }}>
        <Lines fitted={lead} face="sansSemi" lineHeight={1.25} color={rgba(ink, 0.78)} />
      </div>
      {lines.fitted.map((f, i) => (
        <Lines key={i} fitted={f} face="serif" tracking={HEAD_TRACKING} lineHeight={1.04} color={i === last ? spec.brand.accent : ink} />
      ))}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
        {checks.fitted.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", marginTop: i ? 14 : 0 }}>
            <div style={{ width: CHECK, height: CHECK, borderRadius: CHECK / 2, background: spec.brand.secondary, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 24, flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tick(spec.brand.paper)} width={30} height={30} alt="" />
            </div>
            <Lines fitted={f} face="sans" lineHeight={1.3} color={ink} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** PHOTO: the photo's height on the poster; it fades into the ink below. */
export const PHOTO_HEIGHT = 780;
const PHOTO_FADE = 340;

/** PHOTO: the author's photo large at the top, the headline and their name on the dark glow below. */
function PhotoPoster(spec: CoverSpec, paper: string, ink: string) {
  // paper and ink are already swapped: the page is the brand's ink, the words its paper.
  if (!spec.author.photo) throw new CoverFitError("A photo cover needs the author's photo.");
  const label = spec.label ? fitOrThrow("label", spec.label.toUpperCase()) : null;
  const name = fitOrThrow("name", spec.author.name);
  const role = spec.author.role ? fit(spec.author.role, SIZES.role[0], SIZES.role[1], BOX.role) : null;
  const top = PHOTO_HEIGHT - 140;
  const footer = name.size * 1.2 + (role ? role.lines.length * role.size * 1.3 + 4 : 0);
  const room = COVER_SIZE.height - PAD - top - (label ? CHIP_HEIGHT + 32 : 0) - 44 - footer;
  const headline = fitOrThrow("photoHeadline", spec.headline, { maxHeight: room, lineHeight: 1.05 });
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: paper }}>
      <Backdrop spec={spec} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={spec.author.photo} width={COVER_SIZE.width} height={PHOTO_HEIGHT} style={{ position: "absolute", left: 0, top: 0, objectFit: "cover", objectPosition: "center top" }} alt="" />
      <div style={{ position: "absolute", left: 0, top: PHOTO_HEIGHT - PHOTO_FADE, width: COVER_SIZE.width, height: PHOTO_FADE + 2, display: "flex", backgroundImage: `linear-gradient(to bottom, ${rgba(paper, 0)}, ${rgba(paper, 0.75)} 55%, ${paper})` }} />
      <div style={{ position: "absolute", left: PAD, top, width: INNER, height: COVER_SIZE.height - top - PAD, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {label ? (
          <div style={{ display: "flex", marginBottom: 32 }}>
            <Chip text={label} ink={ink} accent={spec.brand.accent} />
          </div>
        ) : null}
        <Lines fitted={headline} face="serif" tracking={HEAD_TRACKING} lineHeight={1.05} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
        <div style={{ display: "flex", alignItems: "center", marginTop: 44 }}>
          <div style={{ width: 8, alignSelf: "stretch", background: spec.brand.accent, borderRadius: 4 }} />
          <Signature author={spec.author} color={ink} muted={rgba(ink, 0.72)} />
        </div>
      </div>
    </div>
  );
}

/** True when the layout draws on the brand's ink (paper-coloured words). */
export const isDark = (layout: CoverLayout) => DARK_BACKGROUNDS.includes(BACKGROUND_FOR[layout]);

/** The cover as a Satori element. Throws CoverFitError when any text cannot fit. */
export function coverElement(spec: CoverSpec) {
  // The modern banner types (modern.tsx) draw their own ground; the accent is tuned to it here.
  if (isBanner(spec.layout)) {
    return bannerElement({ design: spec.layout, headline: spec.headline, emphasis: spec.emphasis, kicker: spec.kicker, label: spec.label, author: spec.author, brand: brandOn(BACKGROUND_FOR[spec.layout], spec.brand), cutout: spec.cutout, tags: tagsFor(spec.grid, spec.list) });
  }
  const dark = isDark(spec.layout);
  // The accent may need deepening to read on this background's most tinted spot.
  spec = { ...spec, backdropBrand: spec.brand, brand: brandOn(BACKGROUND_FOR[spec.layout], spec.brand) };
  const paper = dark ? spec.brand.ink : spec.brand.paper;
  const ink = dark ? spec.brand.paper : spec.brand.ink;
  if (dark) spec = { ...spec, brand: { ...spec.brand, accent: spec.brand.accentOnInk } };
  if (spec.layout === "PHOTO") return PhotoPoster(spec, paper, ink);
  // Called as functions, not rendered as components, so every fit runs now
  // and a CoverFitError throws here rather than inside Satori's render.
  const centre =
    spec.layout === "QUOTE" ? QuoteCentre({ spec, ink })
    : spec.layout === "NUMBER" ? NumberCentre({ spec, ink })
    : spec.layout === "LIST" ? ListCentre({ spec, ink })
    : spec.layout === "GRID" ? GridCentre({ spec, ink })
    : spec.layout === "PUNCH" ? PunchCentre({ spec, ink })
    : HeadlineCentre({ spec, ink, paper });
  return Frame({ spec, paper, ink, children: centre });
}
