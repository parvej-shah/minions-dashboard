/**
 * Cover illustrations, drawn in code like the type. No image model, no stock
 * library with a licence that forbids this use (unDraw's does), so a cover
 * costs nothing and the same draft always gets the same picture.
 *
 *  - SHAPES: abstract motifs in the brand's colours (a waveform for a voice
 *    post, connected steps for a workflow post...). The default.
 *  - DOODLES: hand-drawn Open Doodles figures (CC0), in ink and accent.
 *  - NONE: type only, the phase 5 cover.
 *
 * The motif is chosen by keywords in the post, in code; when none match it
 * is picked from the post id, avoiding the tenant's last few, so a run of
 * covers still varies.
 */
import { DOODLES, type DoodleName } from "./doodles";
import type { CoverArtStyle } from "./artStyles";

export { COVER_ART_STYLES, DEFAULT_COVER_ART_STYLE, COVER_ART_STYLE_META, parseArtStyle, type CoverArtStyle } from "./artStyles";

export const MOTIFS = ["WAVEFORM", "FLOW", "BARS", "FORK", "GRID", "TARGET", "STACK", "LOOP"] as const;
export type Motif = (typeof MOTIFS)[number];

/** by_keyword: the post's words chose the motif (false: rotation by post id). */
export type ArtChoice = ({ style: "SHAPES"; motif: Motif } | { style: "DOODLES"; motif: DoodleName }) & { by_keyword?: boolean };

/** Words that point at a motif. Whole words, case-insensitive. */
const MOTIF_WORDS: Record<Motif, RegExp> = {
  WAVEFORM: /\b(voice|call|calls|calling|caller|phone|speech|speak|speaking|audio|listen|listening|conversation|receptionist|podcast)\b/g,
  FLOW: /\b(workflow|workflows|pipeline|pipelines|agent|agents|process|handoff|hand-off|automate|automation|automating|steps?|sequence|routing|dispatch)\b/g,
  BARS: /\b(revenue|growth|metrics?|results?|conversion|rate|numbers?|data|percent|roi|pipeline value|sales|cost|costs|faster|slower)\b|\d+%/g,
  FORK: /\b(decision|decide|choose|choice|instead|mistake|wrong|lesson|changed my mind|trade-?off|versus|either|fork|pivot|rather)\b/g,
  GRID: /\b(scale|scaling|system|systems|team|teams|every|dozens|hundreds|library|template|templates|consistency|consistent)\b/g,
  TARGET: /\b(focus|target|icp|niche|customer|customers|buyer|buyers|audience|clients?|positioning|leads?|qualify|qualification)\b/g,
  STACK: /\b(stack|layer|layers|build|built|building|ship|shipped|code|tool|tools|infrastructure|architecture|model|models)\b/g,
  LOOP: /\b(loop|feedback|iterate|iteration|weekly|habit|routine|repeat|again|cycle|follow-?ups?|retention)\b/g,
};

const DOODLE_WORDS: Partial<Record<DoodleName, RegExp>> = {
  READING: /\b(learn|learned|learning|lesson|lessons|research|study|read|reading)\b/g,
  SITTING_READING: /\b(book|books|notes|documentation|docs|guide)\b/g,
  CLUMSY: /\b(mistake|mistakes|wrong|fail|failed|fails|failure|broke|broken|mess|chaos|misspell\w*)\b/g,
  UNBOXING: /\b(launch|launched|ship|shipped|new|release|released|built|unveil)\b/g,
  PLANT: /\b(grow|growth|growing|compound|nurture)\b/g,
  MEDITATING: /\b(focus|calm|simple|simpler|simplicity|patience|less)\b/g,
  SPRINTING: /\b(fast|faster|speed|quick|quickly|seconds|minutes|rush)\b/g,
  COFFEE: /\b(morning|daily|routine|week|weekly|habit)\b/g,
};

/** 32-bit FNV-1a: a stable number from a string. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a small seeded generator, so a motif's variation is the same every render. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Motifs the post's words point at, most matches first; ties keep the table's order. */
function ranked<K extends string>(text: string, words: Partial<Record<K, RegExp>>): K[] {
  return (Object.entries(words) as [K, RegExp][])
    .map(([k, re], i) => ({ k, i, n: text.match(re)?.length ?? 0 }))
    .filter((m) => m.n > 0)
    .sort((x, y) => y.n - x.n || x.i - y.i)
    .map((m) => m.k);
}

/**
 * The illustration for a post, or null for NONE. `text` is the headline,
 * title and hook; `recent` the motifs of the tenant's last covers, newest
 * first. The best keyword match is used unless it was on one of the last two
 * covers (then the next match); with no usable match the post id picks one
 * not seen in the last three. `exclude` is the motif a reviewer asked to
 * replace, never returned.
 */
export function chooseArt(style: CoverArtStyle, text: string, seed: string, recent: string[] = [], exclude?: string): ArtChoice | null {
  if (style === "NONE") return null;
  const t = text.toLowerCase();
  const h = hashSeed(seed);
  const lastTwo = new Set([...recent.slice(0, 2), ...(exclude ? [exclude] : [])]);
  const lastThree = new Set([...recent.slice(0, 3), ...(exclude ? [exclude] : [])]);
  const pick = <K extends string>(matches: K[], all: readonly K[]): { motif: K; by_keyword: boolean } => {
    const match = matches.find((m) => !lastTwo.has(m));
    if (match) return { motif: match, by_keyword: true };
    const pool = all.filter((k) => !lastThree.has(k));
    const from = pool.length ? pool : all.filter((k) => k !== exclude);
    return { motif: from[h % from.length], by_keyword: false };
  };
  if (style === "DOODLES") return { style, ...pick(ranked(t, DOODLE_WORDS), Object.keys(DOODLES) as DoodleName[]) };
  return { style, ...pick(ranked(t, MOTIF_WORDS), MOTIFS) };
}

export interface ArtColours {
  /** Lines and most shapes. */
  main: string;
  /** One highlighted element per motif. */
  highlight: string;
  /** The paper behind, for hollow shapes. */
  bg: string;
  /** Doodles only: the figure's outline colour. */
  ink: string;
}

const W = 640;
const H = 200;
const svg = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const r1 = (n: number) => Math.round(n * 10) / 10;

type Draw = (rnd: () => number, c: ArtColours) => string;

const DRAW: Record<Motif, Draw> = {
  WAVEFORM: (rnd, c) => {
    const n = 22;
    const phase = rnd() * 6;
    const hi = new Set([Math.floor(rnd() * n), Math.floor(rnd() * n), Math.floor(rnd() * n)]);
    return Array.from({ length: n }, (_, i) => {
      const amp = Math.abs(Math.sin(i * 0.5 + phase) * Math.cos(i * 0.19 + phase / 2));
      const h = r1(28 + 164 * amp);
      return `<rect x="${i * 29 + 4}" y="${r1(H / 2 - h / 2)}" width="14" height="${h}" rx="7" fill="${hi.has(i) ? c.highlight : c.main}"/>`;
    }).join("");
  },
  FLOW: (rnd, c) => {
    const n = 5;
    const pts = Array.from({ length: n }, (_, i) => [40 + i * 140, r1(40 + rnd() * 120)]);
    const hi = 1 + Math.floor(rnd() * (n - 1));
    const lines = pts.slice(1).map((p, i) => `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${p[0]}" y2="${p[1]}" stroke="${c.main}" stroke-width="7" stroke-linecap="round"/>`).join("");
    const dots = pts
      .map((p, i) => (i === hi ? `<circle cx="${p[0]}" cy="${p[1]}" r="32" fill="${c.highlight}"/>` : `<circle cx="${p[0]}" cy="${p[1]}" r="22" fill="${c.bg}" stroke="${c.main}" stroke-width="7"/>`))
      .join("");
    return lines + dots;
  },
  BARS: (rnd, c) => {
    const n = 7;
    return Array.from({ length: n }, (_, i) => {
      const h = r1(30 + (150 * (i + 1)) / n - rnd() * 26);
      return `<rect x="${i * 86 + 20}" y="${r1(H - h)}" width="56" height="${h}" rx="6" fill="${i === n - 1 ? c.highlight : c.main}" opacity="${i === n - 1 ? 1 : r1(0.45 + (0.5 * i) / n)}"/>`;
    }).join("");
  },
  FORK: (rnd, c) => {
    const splitX = r1(220 + rnd() * 80);
    const up = r1(30 + rnd() * 20);
    const down = r1(170 - rnd() * 20);
    const path = (y: number) => `M ${splitX} 100 C ${splitX + 120} 100, ${splitX + 120} ${y}, ${W - 60} ${y}`;
    return (
      `<line x1="30" y1="100" x2="${splitX}" y2="100" stroke="${c.main}" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="${path(down)}" fill="none" stroke="${c.main}" stroke-width="8" stroke-linecap="round" stroke-dasharray="4 18" opacity="0.6"/>` +
      `<path d="${path(up)}" fill="none" stroke="${c.main}" stroke-width="8" stroke-linecap="round"/>` +
      `<circle cx="${W - 44}" cy="${up}" r="26" fill="${c.highlight}"/>` +
      `<circle cx="${W - 44}" cy="${down}" r="18" fill="${c.bg}" stroke="${c.main}" stroke-width="6" opacity="0.6"/>` +
      `<circle cx="30" cy="100" r="14" fill="${c.main}"/>`
    );
  },
  GRID: (rnd, c) => {
    const cols = 14;
    const rows = 5;
    const lit = new Set(Array.from({ length: 4 }, () => Math.floor(rnd() * cols * rows)));
    let out = "";
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        out += lit.has(i)
          ? `<circle cx="${x * 45 + 22}" cy="${y * 40 + 20}" r="15" fill="${c.highlight}"/>`
          : `<circle cx="${x * 45 + 22}" cy="${y * 40 + 20}" r="8" fill="${c.main}" opacity="${r1(0.35 + rnd() * 0.5)}"/>`;
      }
    return out;
  },
  TARGET: (rnd, c) => {
    const cx = r1(100 + rnd() * 60);
    const rings = [90, 70, 50, 30]
      .map((r, i) => `<circle cx="${cx}" cy="100" r="${r}" fill="none" stroke="${c.main}" stroke-width="7" opacity="${r1(0.4 + i * 0.2)}"/>`)
      .join("");
    const dots = Array.from({ length: 9 }, (_, i) => `<circle cx="${r1(cx + 150 + i * 44)}" cy="${r1(100 + (rnd() - 0.5) * 120)}" r="${r1(7 + rnd() * 6)}" fill="${c.main}" opacity="0.4"/>`).join("");
    return rings + `<circle cx="${cx}" cy="100" r="14" fill="${c.highlight}"/>` + dots;
  },
  STACK: (rnd, c) => {
    const n = 4;
    const hi = Math.floor(rnd() * n);
    return Array.from({ length: n }, (_, i) => {
      const x = 60 + i * 60;
      const y = 20 + (n - 1 - i) * 34;
      return `<rect x="${x}" y="${y}" width="${r1(300 + rnd() * 40)}" height="64" rx="12" fill="${i === hi ? c.highlight : c.bg}" stroke="${i === hi ? c.highlight : c.main}" stroke-width="7"/>`;
    }).join("");
  },
  LOOP: (rnd, c) => {
    const cx = r1(120 + rnd() * 40);
    const r = 76;
    // An arc of about 300 degrees with an arrowhead where it ends.
    const a0 = -Math.PI / 2 + 0.35;
    const a1 = a0 + Math.PI * 1.7;
    const [x0, y0] = [cx + r * Math.cos(a0), 100 + r * Math.sin(a0)];
    const [x1, y1] = [cx + r * Math.cos(a1), 100 + r * Math.sin(a1)];
    const tip = `${r1(x1 + 22)},${r1(y1 - 4)} ${r1(x1 - 4)},${r1(y1 - 26)} ${r1(x1 - 8)},${r1(y1 + 10)}`;
    const trail = Array.from({ length: 6 }, (_, i) => `<rect x="${r1(cx + 130 + i * 62)}" y="${r1(84 - rnd() * 10)}" width="40" height="${r1(32 + rnd() * 10)}" rx="8" fill="${i === 5 ? c.highlight : c.main}" opacity="${i === 5 ? 1 : r1(0.25 + i * 0.12)}"/>`).join("");
    return `<path d="M ${r1(x0)} ${r1(y0)} A ${r} ${r} 0 1 1 ${r1(x1)} ${r1(y1)}" fill="none" stroke="${c.main}" stroke-width="9" stroke-linecap="round"/><polygon points="${tip}" fill="${c.main}"/><circle cx="${cx}" cy="100" r="16" fill="${c.highlight}"/>` + trail;
  },
};

const dataUrl = (s: string) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;

/** The illustration as an SVG string, coloured. Exposed for tests. */
export function artSvg(choice: ArtChoice, seed: string, c: ArtColours): { svg: string; aspect: number } {
  if (choice.style === "DOODLES") {
    const d = DOODLES[choice.motif];
    const [, , w, h] = d.viewBox.split(" ").map(Number);
    const body = d.body.replaceAll("__INK__", c.ink).replaceAll("__ACCENT__", c.highlight);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${d.viewBox}" width="${w}" height="${h}">${body}</svg>`, aspect: w / h };
  }
  const rnd = random(hashSeed(`${seed}:${choice.motif}`));
  return { svg: svg(W, H, DRAW[choice.motif](rnd, c)), aspect: W / H };
}

/** The illustration as a data URL for the cover renderer, and its width / height. */
export function drawArt(choice: ArtChoice, seed: string, c: ArtColours): { src: string; aspect: number } {
  const { svg: s, aspect } = artSvg(choice, seed, c);
  return { src: dataUrl(s), aspect };
}
