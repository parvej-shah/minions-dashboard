/**
 * Poster backgrounds (DECISIONS.md "Five poster types, each with its own
 * background", 2026-11-09). Each is an SVG drawn only from the brand's
 * colours, so it works for any palette with no tuning per tenant, and each
 * keeps its shapes away from where text sits: soft colour stays in a
 * corner, a colour block stays under the author line.
 *
 * `ground` is the darkest or most tinted colour any text can sit on, so
 * contrast is checked against the worst case, not the paper.
 */
import type { CoverBrand, CoverLayout } from "./layouts";

export const BACKGROUNDS = ["MESH", "AURORA", "GRID", "FOLDED", "BLOCK"] as const;
export type Background = (typeof BACKGROUNDS)[number];

/** Each type always has its own background (fixed per type, not chosen). */
export const BACKGROUND_FOR: Record<CoverLayout, Background> = {
  /** Unused: a custom design draws its own ground. */
  CUSTOM: "MESH",
  HEADLINE: "MESH",
  QUOTE: "MESH",
  STATEMENT: "AURORA",
  PHOTO: "AURORA",
  LIST: "GRID",
  NUMBER: "FOLDED",
  GRID: "FOLDED",
  PUNCH: "BLOCK",
  // The banner types draw their own ground; this is the one it is closest to, for tuning the accent.
  TORN: "MESH",
  SELECT: "MESH",
  STICKER: "GRID",
  NOTEBOOK: "MESH",
  NOTES: "MESH",
  POSTCARD: "AURORA",
  CIRCLED: "FOLDED",
  CUTOUT: "AURORA",
  HIGHLIGHT: "AURORA",
  SWISS: "MESH",
  SIDEWAYS: "AURORA",
  ECHO: "AURORA",
  BOLD: "BLOCK",
  SPLIT: "MESH",
  MAGAZINE: "AURORA",
  BENTO: "MESH",
  TAGGED: "GRID",
  NEON: "AURORA",
};

/** Dark backgrounds put paper-coloured text on the ink. */
export const DARK_BACKGROUNDS: Background[] = ["AURORA"];

const W = 1080;
const H = 1350;
/** BLOCK: the band's top edge at the left and right, above the author line. */
export const BLOCK_TOP = { left: 1100, right: 1010 } as const;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastOf(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * BLOCK: the band colour. The brand accent, deepened toward the ink until
 * paper-coloured text on it reaches 4.5:1, so the author line reads.
 */
export function blockColour(brand: CoverBrand): string {
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const c = mix(brand.accent, brand.ink, t);
    if (contrastOf(brand.paper, c) >= 4.5) return c;
  }
  return brand.ink;
}

/** Strength of the tints, also used for the worst-case grounds below. */
const T = { meshAccent: 0.34, meshSecondary: 0.22, auroraSecondary: 0.55, auroraAccent: 0.32, gridGlow: 0.16, fold: 0.07, crease: 0.1 } as const;

/**
 * The most tinted colour text can sit on, per background: the contrast check
 * uses it. Measured from rendered backgrounds (the darkest 0.1% of pixels
 * where text can go, or the lightest on the dark one) and rounded up.
 */
export function ground(bg: Background, brand: CoverBrand): { text: string; footer: string } {
  switch (bg) {
    case "MESH":
      return { text: mix(brand.paper, brand.accent, 0.26), footer: mix(brand.paper, brand.accent, 0.3) };
    case "AURORA":
      return { text: mix(brand.ink, brand.paper, 0.2), footer: mix(brand.ink, brand.paper, 0.1) };
    case "GRID":
      return { text: mix(brand.paper, brand.ink, 0.16), footer: mix(brand.paper, brand.ink, 0.16) };
    case "FOLDED":
      return { text: mix(brand.paper, brand.ink, 0.18), footer: mix(brand.paper, brand.ink, 0.18) };
    case "BLOCK":
      return { text: brand.paper, footer: blockColour(brand) };
  }
}

/** Large text (the accent word, the last punch line) needs 3:1 on its ground. */
const LARGE = 3;

/**
 * The brand with its accent adjusted for this background: deepened toward
 * the ink (lightened toward the paper on a dark background) only as far as
 * it takes to read on the most tinted spot. Most palettes are unchanged.
 */
export function brandOn(bg: Background, brand: CoverBrand): CoverBrand {
  const g = ground(bg, brand).text;
  const dark = DARK_BACKGROUNDS.includes(bg);
  const key = dark ? "accentOnInk" : "accent";
  const toward = dark ? brand.paper : brand.ink;
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const c = mix(brand[key], toward, t);
    if (contrastOf(c, g) >= LARGE) return { ...brand, [key]: c };
  }
  return { ...brand, [key]: toward };
}

function svg(bg: Background, b: CoverBrand): string {
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  switch (bg) {
    case "MESH":
      // Soft colour pooled in the bottom-right corner, behind no headline.
      return `${open}<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="150"/></filter></defs>
        <rect width="${W}" height="${H}" fill="${b.paper}"/>
        <g filter="url(#b)">
          <circle cx="1060" cy="1240" r="360" fill="${b.accent}" fill-opacity="${T.meshAccent}"/>
          <circle cx="640" cy="1420" r="280" fill="${b.secondary}" fill-opacity="${T.meshSecondary}"/>
          <circle cx="1160" cy="980" r="200" fill="${mix(b.accent, b.paper, 0.4)}" fill-opacity="${T.meshAccent}"/>
        </g></svg>`;
    case "AURORA":
      // Light glowing from the top-right corner of the ink, with a soft vignette.
      return `${open}<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="160"/></filter>
        <radialGradient id="v" cx="0.5" cy="0.45" r="0.8"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="${b.ink}"/>
        <g filter="url(#b)">
          <ellipse cx="980" cy="120" rx="420" ry="260" fill="${b.secondary}" fill-opacity="${T.auroraSecondary}"/>
          <ellipse cx="1080" cy="420" rx="280" ry="180" fill="${b.accentOnInk}" fill-opacity="${T.auroraAccent}"/>
        </g>
        <rect width="${W}" height="${H}" fill="url(#v)"/></svg>`;
    case "GRID":
      // Engineering paper: a faint grid, fading out under the headline, a glow in one corner and a little grain.
      return `${open}<defs>
          <pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="${b.ink}" stroke-opacity="0.07" stroke-width="1.5"/></pattern>
          <radialGradient id="glow" cx="0.9" cy="0.92" r="0.5"><stop offset="0" stop-color="${b.accent}" stop-opacity="${T.gridGlow}"/><stop offset="1" stop-color="${b.accent}" stop-opacity="0"/></radialGradient>
          <radialGradient id="fade" cx="0.25" cy="0.3" r="0.8"><stop offset="0" stop-color="${b.paper}" stop-opacity="0.85"/><stop offset="1" stop-color="${b.paper}" stop-opacity="0"/></radialGradient>
          <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/></filter>
        </defs>
        <rect width="${W}" height="${H}" fill="${b.paper}"/>
        <rect width="${W}" height="${H}" fill="url(#g)"/>
        <rect width="${W}" height="${H}" fill="url(#fade)"/>
        <rect width="${W}" height="${H}" fill="url(#glow)"/>
        <rect width="${W}" height="${H}" filter="url(#n)"/></svg>`;
    case "FOLDED": {
      // A sheet folded twice on the right: each panel lit differently, a shadow in each crease, a highlight on its ridge.
      const lit = mix(b.paper, "#ffffff", 0.5);
      const shade = mix(b.paper, b.ink, T.fold);
      return `${open}<defs>
          <linearGradient id="p1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lit}"/><stop offset="1" stop-color="${b.paper}"/></linearGradient>
          <linearGradient id="p2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade}"/><stop offset="1" stop-color="${mix(b.paper, b.ink, 0.03)}"/></linearGradient>
          <linearGradient id="p3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lit}"/><stop offset="1" stop-color="${mix(b.paper, b.ink, 0.05)}"/></linearGradient>
          <linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${b.ink}" stop-opacity="${T.crease}"/><stop offset="1" stop-color="${b.ink}" stop-opacity="0"/></linearGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#p1)"/>
        <polygon points="760,0 1080,0 1080,1350 560,1350" fill="url(#p2)"/>
        <polygon points="940,0 1080,0 1080,1350 860,1350" fill="url(#p3)"/>
        <polygon points="760,0 810,0 610,1350 560,1350" fill="url(#c)"/>
        <polygon points="940,0 980,0 900,1350 860,1350" fill="url(#c)"/>
        <line x1="760" y1="0" x2="560" y2="1350" stroke="#ffffff" stroke-opacity="0.9" stroke-width="3"/>
        <line x1="940" y1="0" x2="860" y2="1350" stroke="#ffffff" stroke-opacity="0.9" stroke-width="3"/></svg>`;
    }
    case "BLOCK": {
      // A deep accent band cut on a diagonal under the author line, with a thin secondary edge.
      const band = blockColour(b);
      const { left, right } = BLOCK_TOP;
      return `${open}<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${band}"/><stop offset="1" stop-color="${mix(band, b.ink, 0.2)}"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="${b.paper}"/>
        <polygon points="0,${left - 26} ${W},${right - 26} ${W},${H} 0,${H}" fill="${b.secondary}"/>
        <polygon points="0,${left} ${W},${right} ${W},${H} 0,${H}" fill="url(#a)"/></svg>`;
    }
  }
}

/** The background as a data URL for the cover renderer. */
export function backgroundSrc(bg: Background, brand: CoverBrand): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg(bg, brand)).toString("base64")}`;
}
