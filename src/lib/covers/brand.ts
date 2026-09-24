import type { CoverBrand } from "./layouts";

/**
 * A tenant's colours for a cover, checked for contrast in code. A brand
 * colour that would make a cover hard to read at feed size is deepened or
 * replaced, never used as is: legibility on a phone is the cover's first job.
 */
export const DEFAULT_COVER_BRAND: CoverBrand = { ink: "#12242a", paper: "#fff8f0", accent: "#ff6b4a", accentOnInk: "#ff6b4a", secondary: "#0e5c63" };

/** Body text: WCAG AAA. The headline carries the post, so it gets the strictest bar. */
const TEXT_CONTRAST = 7;
/** The accent word, the number and the monogram are large type: WCAG large-text AA. */
const LARGE_CONTRAST = 3;

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, "$&$&") : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mix(a: string, b: string, t: number): string {
  const rgb = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** The colour, moved toward `toward` in 5% steps until it reaches large-text contrast on bg. */
function readableOn(colour: string, bg: string, toward: string): string {
  for (let t = 0; t <= 1; t += 0.05) {
    const c = t === 0 ? colour : mix(colour, toward, t);
    if (contrast(c, bg) >= LARGE_CONTRAST) return c;
  }
  return toward;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const valid = (c: string | null | undefined) => {
  const m = c?.trim().match(HEX);
  if (!m) return null;
  return `#${m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1]}`.toLowerCase();
};

export function coverBrand(colors: { ink?: string | null; paper?: string | null; accent?: string | null; secondary?: string | null }): { brand: CoverBrand; notes: string[] } {
  const notes: string[] = [];
  let ink = valid(colors.ink) ?? DEFAULT_COVER_BRAND.ink;
  let paper = valid(colors.paper) ?? DEFAULT_COVER_BRAND.paper;
  if (contrast(ink, paper) < TEXT_CONTRAST) {
    notes.push(`Brand ink ${ink} on ${paper} is too low-contrast for a cover; default colours used.`);
    ink = DEFAULT_COVER_BRAND.ink;
    paper = DEFAULT_COVER_BRAND.paper;
  }
  // The accent sits on paper in the light layouts and on ink in the dark
  // STATEMENT layout. A brand accent too light for paper is deepened toward
  // the ink until it reads, which keeps its hue; the original is kept for ink.
  const brandAccent = valid(colors.accent) ?? DEFAULT_COVER_BRAND.accent;
  const accent = readableOn(brandAccent, paper, ink);
  if (accent !== brandAccent) notes.push(`Accent ${brandAccent} deepened to ${accent} to read on ${paper}.`);
  const accentOnInk = contrast(brandAccent, ink) >= LARGE_CONTRAST ? brandAccent : readableOn(brandAccent, ink, paper);
  let secondary = valid(colors.secondary) ?? DEFAULT_COVER_BRAND.secondary;
  if (contrast(secondary, paper) < LARGE_CONTRAST) {
    notes.push(`Secondary ${secondary} is too light on ${paper}; the ink colour is used instead.`);
    secondary = ink;
  }
  return { brand: { ink, paper, accent, accentOnInk, secondary }, notes };
}
