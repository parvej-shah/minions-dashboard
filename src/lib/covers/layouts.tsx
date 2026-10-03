/**
 * Editorial cover layouts (phase 5 of docs/product/authority-flywheel-plan.md).
 * Every letter on a cover is drawn here, never by an image model. All layouts
 * share one frame -- paper, type, audience label and the author's signature --
 * so a reader learns to recognise the author's posts in the feed; the layouts
 * vary only the centre, so a run of posts still has rhythm.
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
const centreHeight = (spec: { label?: string }) => COVER_SIZE.height - PAD * 2 - (spec.label ? 40 + 48 : 0) - 48 - 42 - AVATAR;

export const COVER_LAYOUTS = ["HEADLINE", "STATEMENT", "QUOTE", "NUMBER"] as const;
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

// Every text box on the cover. Sizes are px on the 1080-wide canvas, which a
// phone feed shows about 360 wide (a third): the smallest (30) is about 10px
// there, the floor for a secondary line; a headline is never under 24px.
const BOX = {
  label: { face: "sansSemi", maxWidth: INNER - 64, maxLines: 1, tracking: 0.12 },
  headline: { face: "serif", maxWidth: INNER, maxLines: HEADLINE_LINES, tracking: -0.02 },
  kicker: { face: "sans", maxWidth: INNER, maxLines: 2 },
  quote: { face: "serifItalic", maxWidth: INNER, maxLines: 4, tracking: -0.01 },
  numberHeadline: { face: "serif", maxWidth: INNER, maxLines: HEADLINE_LINES, tracking: -0.015 },
  name: { face: "sansSemi", maxWidth: INNER - AVATAR - 28, maxLines: 1 },
  role: { face: "sans", maxWidth: INNER - AVATAR - 28, maxLines: 2 },
} satisfies Record<string, TextBox>;

const SIZES: Record<keyof typeof BOX, readonly [number, number]> = {
  label: [30, 34],
  headline: [72, 150],
  kicker: [36, 44],
  quote: [60, 124],
  numberHeadline: [60, 84],
  name: [40, 46],
  role: [30, 34],
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
export function Lines({ fitted, face, tracking = 0, lineHeight, color, emphasis, accent }: { fitted: Fitted; face: Face; tracking?: number; lineHeight: number; color: string; emphasis?: string; accent?: string }) {
  const { size, lines } = fitted;
  const spacing = tracking * size;
  const space = textWidth(metricsFor(face), " ", size, spacing);
  const target = emphasis ? wordKey(emphasis) : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", ...faceStyle(face), fontSize: size, lineHeight, letterSpacing: spacing, color }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", flexShrink: 0 }}>
          {line.split(" ").map((w, j) => (
            <div key={j} style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", marginRight: space, color: target && accent && wordKey(w) === target ? accent : color }}>
              {w}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Frame({ spec, paper, ink, children }: { spec: CoverSpec; paper: string; ink: string; children: ReactNode }) {
  const { author, brand } = spec;
  const label = spec.label ? fitOrThrow("label", spec.label.toUpperCase()) : null;
  const name = fitOrThrow("name", author.name);
  // A byline too long to read at feed size is left off rather than costing the cover.
  const role = author.role ? fit(author.role, SIZES.role[0], SIZES.role[1], BOX.role) : null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: paper, padding: PAD }}>
      {label ? (
        <div style={{ display: "flex", alignItems: "center", height: 40, marginBottom: 48 }}>
          <div style={{ width: 44, height: 6, background: brand.accent, marginRight: 20 }} />
          <Lines fitted={label} face="sansSemi" tracking={0.12} lineHeight={1} color={rgba(ink, 0.74)} />
        </div>
      ) : null}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: 48 }}>{children}</div>

      <div style={{ height: 2, background: rgba(ink, 0.14), marginBottom: 40 }} />
      <div style={{ display: "flex", alignItems: "center" }}>
        {author.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.photo} width={AVATAR} height={AVATAR} style={{ borderRadius: AVATAR / 2, objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, background: brand.secondary, color: brand.paper, display: "flex", alignItems: "center", justifyContent: "center", ...faceStyle("sansBold"), fontSize: 44 }}>
            {initials(author.name)}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
          <Lines fitted={name} face="sansSemi" lineHeight={1.2} color={ink} />
          {role ? (
            <div style={{ display: "flex", marginTop: 4 }}>
              <Lines fitted={role} face="sans" lineHeight={1.3} color={rgba(ink, 0.66)} />
            </div>
          ) : null}
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
      <Lines fitted={headline} face="serif" tracking={-0.02} lineHeight={1.05} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
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
      <div style={{ display: "flex", ...faceStyle("serif"), fontSize: 260, lineHeight: 0.8, height: QUOTE_MARK_HEIGHT, color: spec.brand.accent }}>“</div>
      <Lines fitted={quote} face="serifItalic" tracking={-0.01} lineHeight={1.18} color={ink} />
    </div>
  );
}

const UNIT_SIZE = 72;

function NumberCentre({ spec, ink }: { spec: CoverSpec; ink: string }) {
  const n = spec.number ?? { value: "" };
  const unitWidth = n.unit ? textWidth(metricsFor("serifItalic"), n.unit, UNIT_SIZE) + 24 : 0;
  const value = fit(n.value, 160, 380, { face: "sansBold", maxWidth: INNER - unitWidth, maxLines: 1, tracking: -0.04 });
  if (!value || !n.value.trim()) throw new CoverFitError(`The number does not fit this cover: "${n.value}"`);
  const headline = fitOrThrow("numberHeadline", spec.headline, { maxHeight: centreHeight(spec) - value.size * 0.9 - 110, lineHeight: 1.1 });
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div style={{ display: "flex", ...faceStyle("sansBold"), fontSize: value.size, lineHeight: 0.9, letterSpacing: -0.04 * value.size, color: spec.brand.secondary }}>{n.value}</div>
        {n.unit ? <div style={{ display: "flex", ...faceStyle("serifItalic"), fontSize: UNIT_SIZE, marginLeft: 24, marginBottom: value.size * 0.06, color: ink }}>{n.unit}</div> : null}
      </div>
      <div style={{ height: 6, width: 120, background: spec.brand.accent, marginTop: 56, marginBottom: 48 }} />
      <Lines fitted={headline} face="serif" tracking={-0.015} lineHeight={1.1} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
    </div>
  );
}

/** The cover as a Satori element. Throws CoverFitError when any text cannot fit. */
export function coverElement(spec: CoverSpec) {
  const dark = spec.layout === "STATEMENT";
  const paper = dark ? spec.brand.ink : spec.brand.paper;
  const ink = dark ? spec.brand.paper : spec.brand.ink;
  if (dark) spec = { ...spec, brand: { ...spec.brand, accent: spec.brand.accentOnInk } };
  // Called as functions, not rendered as components, so every fit runs now
  // and a CoverFitError throws here rather than inside Satori's render.
  const centre = spec.layout === "QUOTE" ? QuoteCentre({ spec, ink }) : spec.layout === "NUMBER" ? NumberCentre({ spec, ink }) : HeadlineCentre({ spec, ink, paper });
  return Frame({ spec, paper, ink, children: centre });
}
