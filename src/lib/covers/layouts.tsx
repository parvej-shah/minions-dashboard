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
import { fit, type Fitted, type TextBox } from "./fit";
import { textWidth } from "./metrics";
import { drawArt, type ArtChoice } from "./art";

export const COVER_SIZE = { width: 1080, height: 1350 } as const;
const PAD = 88;
const INNER = COVER_SIZE.width - PAD * 2;
// Label row (40) + centre margins (2 x 48) + divider (2 + 40) + signature (108).
const CENTRE_HEIGHT = COVER_SIZE.height - PAD * 2 - 40 - 96 - 42 - 108;

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
}

export class CoverFitError extends Error {}

// Every text box on the cover. Sizes are px on the 1080-wide canvas; the
// smallest (26) is about 9px at phone feed width (360), the floor for a
// secondary line.
const BOX = {
  label: { face: "sansSemi", maxWidth: INNER - 64, maxLines: 1, tracking: 0.12 },
  headline: { face: "serif", maxWidth: INNER, maxLines: 5, tracking: -0.02 },
  kicker: { face: "sans", maxWidth: INNER, maxLines: 3 },
  quote: { face: "serifItalic", maxWidth: INNER, maxLines: 7, tracking: -0.01 },
  numberHeadline: { face: "serif", maxWidth: INNER, maxLines: 4, tracking: -0.015 },
  name: { face: "sansSemi", maxWidth: INNER - 136, maxLines: 1 },
  role: { face: "sans", maxWidth: INNER - 136, maxLines: 2 },
} satisfies Record<string, TextBox>;

const SIZES: Record<keyof typeof BOX, readonly [number, number]> = {
  label: [26, 30],
  headline: [72, 150],
  kicker: [32, 42],
  quote: [56, 124],
  numberHeadline: [52, 80],
  name: [32, 38],
  role: [26, 30],
};

function fitOrThrow(what: keyof typeof BOX, text: string, height?: { maxHeight: number; lineHeight: number }): Fitted {
  const [min, max] = SIZES[what];
  const f = fit(text, min, max, { ...BOX[what], ...height });
  if (!f) throw new CoverFitError(`The ${what} is too long for this cover: "${text.slice(0, 80)}"`);
  return f;
}

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const initials = (name: string) =>
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
function Lines({ fitted, face, tracking = 0, lineHeight, color, emphasis, accent }: { fitted: Fitted; face: Face; tracking?: number; lineHeight: number; color: string; emphasis?: string; accent?: string }) {
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
  const role = author.role ? fitOrThrow("role", author.role) : null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: paper, padding: PAD }}>
      <div style={{ display: "flex", alignItems: "center", height: 40 }}>
        <div style={{ width: 44, height: 6, background: brand.accent, marginRight: 20 }} />
        {label ? <Lines fitted={label} face="sansSemi" tracking={0.12} lineHeight={1} color={rgba(ink, 0.74)} /> : null}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", margin: "48px 0" }}>{children}</div>

      <div style={{ height: 2, background: rgba(ink, 0.14), marginBottom: 40 }} />
      <div style={{ display: "flex", alignItems: "center" }}>
        {author.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.photo} width={108} height={108} style={{ borderRadius: 54, objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: 108, height: 108, borderRadius: 54, background: brand.secondary, color: brand.paper, display: "flex", alignItems: "center", justifyContent: "center", ...faceStyle("sansBold"), fontSize: 40 }}>
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
/** Shapes are wide and light; a doodle is a figure and needs more height to read at feed size. */
const artHeight = (spec: CoverSpec) => (!spec.art ? 0 : spec.art.choice.style === "DOODLES" ? 260 : 200);
const ART_GAP = 56;
/** With art, a headline set smaller than this reads worse than one without art; the caller retries without. */
const ART_MIN_HEADLINE = 84;

function Art({ spec, ink, paper }: { spec: CoverSpec; ink: string; paper: string }) {
  if (!spec.art) return null;
  const dark = spec.layout === "STATEMENT";
  const { src, aspect } = drawArt(spec.art.choice, spec.art.seed, {
    main: dark ? rgba(ink, 0.8) : spec.brand.secondary,
    highlight: spec.brand.accent,
    bg: paper,
    ink,
  });
  const height = artHeight(spec);
  const width = Math.min(INNER, Math.round(height * aspect));
  return (
    <div style={{ display: "flex", height, marginBottom: ART_GAP }}>
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
  const artSpace = spec.art ? artHeight(spec) + ART_GAP : 0;
  const headline = fitOrThrow("headline", spec.headline, { maxHeight: CENTRE_HEIGHT - kickerHeight - artSpace, lineHeight: 1.05 });
  if (spec.art && headline.size < ART_MIN_HEADLINE) throw new CoverFitError(`With the illustration the headline would be set at ${headline.size}px; drawn without it.`);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {Art({ spec, ink, paper })}
      <Lines fitted={headline} face="serif" tracking={-0.02} lineHeight={1.05} color={ink} emphasis={spec.emphasis} accent={spec.brand.accent} />
      {kicker ? (
        <div style={{ display: "flex", marginTop: KICKER_GAP }}>
          <Lines fitted={kicker} face="sans" lineHeight={1.35} color={rgba(ink, 0.72)} />
        </div>
      ) : null}
    </div>
  );
}

function QuoteCentre({ spec, ink }: { spec: CoverSpec; ink: string }) {
  const quote = fitOrThrow("quote", spec.quote || spec.headline, { maxHeight: CENTRE_HEIGHT - QUOTE_MARK_HEIGHT, lineHeight: 1.18 });
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
  const headline = fitOrThrow("numberHeadline", spec.headline, { maxHeight: CENTRE_HEIGHT - value.size * 0.9 - 110, lineHeight: 1.1 });
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
