/**
 * Cover illustrations, drawn in code like the type. No image model, no stock
 * library with a licence that forbids this use (unDraw's does), so a cover
 * costs nothing and the same draft always gets the same picture.
 *
 *  - SHAPES: abstract motifs in the brand's colours (a waveform for a voice
 *    post, connected steps for a workflow post...). The default.
 *  - DOODLES: hand-drawn Open Doodles figures (CC0), in ink and accent.
 *  - ICONS: one thin line drawing of an object in the accent (Phosphor Icons, MIT; icons.ts),
 *    the same set carousel pages use.
 *  - NONE: type only, the phase 5 cover.
 *
 * The motif is chosen by keywords in the post, in code; when none match it
 * is picked from the post id, avoiding the tenant's last few, so a run of
 * covers still varies.
 */
import { DOODLES, type DoodleName } from "./doodles";
import { ICON_MEANING, ICONS, type IconName } from "./icons";
import type { CoverArtStyle } from "./artStyles";

export { COVER_ART_STYLES, DEFAULT_COVER_ART_STYLE, COVER_ART_STYLE_META, parseArtStyle, type CoverArtStyle } from "./artStyles";

export const MOTIFS = [
  "WAVEFORM", "CHAT", "FUNNEL", "CLOCK", "SHIELD", "FLOW", "BARS", "BALANCE", "FORK", "STEPS", "LOOP", "TARGET", "STACK", "GRID", "SPARK",
  "HOUSE", "CALENDAR", "DOCUMENT", "KEY", "PEOPLE", "LINK", "MEGAPHONE", "GEAR",
] as const;
export type Motif = (typeof MOTIFS)[number];

/** by_keyword: the post's words chose the motif (false: rotation by post id). */
export type ArtChoice = ({ style: "SHAPES"; motif: Motif } | { style: "DOODLES"; motif: DoodleName } | { style: "ICONS"; motif: IconName }) & { by_keyword?: boolean };

/**
 * Words that point at a motif: whole words, case-insensitive. On a tie the
 * earlier, more specific motif wins, so the table runs from the most
 * specific (a call, a funnel) to the most general (a grid, a spark).
 */
const MOTIF_WORDS: Record<Motif, RegExp> = {
  HOUSE: /\b(real estate|homes?|house|houses|propert(y|ies)|listings?|showings?|brokerages?|brokers?|realtors?|mortgages?|rentals?|landlords?|tenants?)\b/g,
  CALENDAR: /\b(calendars?|appointments?|schedul\w*|booked|bookings?|meetings?|slots?|dates?|reservations?)\b/g,
  WAVEFORM: /\b(voice|microphones?|mic|headsets?|sound ?waves?|calls?|calling|caller|phone|speech|speak|speaking|audio|listen|listening|receptionist|podcast|voicemail)\b/g,
  CHAT: /\b(speech bubbles?|bubbles?|conversations?|chat|chats|messages?|repl(y|ies)|comments?|dms?|emails?|questions?|asked|answers?|sms|texts?|inbox)\b/g,
  DOCUMENT: /\b(documents?|docs|records?|crm|notes|forms?|checklists?|contracts?|paperwork|pages?|transcripts?|fields?|schemas?)\b/g,
  MEGAPHONE: /\b(megaphones?|marketing|ads|advertis\w*|campaigns?|announc\w*|awareness|promot\w*|reach|visibility|outreach)\b/g,
  KEY: /\b(keys?|unlock\w*|access|passwords?|permissions?|solutions?|secrets?)\b/g,
  PEOPLE: /\b(people|humans?|staff|hir(e|es|ing)|employees?|colleagues|coworkers|users?|reps?|human agents?|salespeople|recruit\w*)\b/g,
  LINK: /\b(links?|chains?|connect\w*|integrat\w*|handoffs?|hand-offs?|sync\w*|bridges?|together)\b/g,
  FUNNEL: /\b(leads?|qualify|qualification|qualified|conversion|convert|converts|funnel|inbound|prospects?|demos?|signups?)\b/g,
  CLOCK: /\b(timers?|stopwatch|hourglass|fast|faster|slow|slower|speed|minutes?|seconds?|hours?|delay|late|latency|response time|waiting|wait|deadline|24\/7|after-hours|overnight)\b/g,
  SHIELD: /\b(locks?|padlock|checkmarks?|check marks?|badges?|trust|safe|safety|secure|security|risks?|compliance|privacy|protect|fraud|legal|disclosure|liability|guardrails?)\b/g,
  GEAR: /\b(gears?|cogs?|machine\w*|engines?|mechanic\w*|settings|configur\w*|tuning|operations|ops|maintenance)\b/g,
  FLOW: /\b(flowcharts?|nodes?|arrows?|workflows?|pipelines?|agents?|process|processes|automate|automation|automating|routing|dispatch)\b/g,
  BARS: /\b(charts?|graphs?|revenue|growth|metrics?|results?|numbers?|data|percent|roi|sales|profit|reports?|dashboards?|kpis?)\b|\d+%/g,
  BALANCE: /\b(trade-?offs?|balance|versus|vs|worth|pric(e|es|ing)|budget|costs?|tension|compromise)\b/g,
  FORK: /\b(branch(es|ing)?|splits?|forks?|crossroads|decisions?|decide|choose|choice|instead|mistakes?|wrong|changed my mind|pivot|rather)\b/g,
  STEPS: /\b(stairs?|staircase|steps?|stages?|levels?|ladder|roadmap|phases?|progress|playbook)\b/g,
  LOOP: /\b(circular|loops?|feedback|iterate|iteration|weekly|habits?|routine|repeat|cycle|follow-?ups?|retention|recurring)\b/g,
  TARGET: /\b(bullseye|crosshairs?|focus|target|icp|niche|customers?|buyers?|audience|clients?|positioning|goals?)\b/g,
  STACK: /\b(servers?|databases?|blocks?|stack|layers?|build|built|building|code|tools?|infrastructure|architecture|models?|software|platform|api)\b/g,
  GRID: /\b(scale|scaling|systems?|teams?|every|dozens|hundreds|library|templates?|consistency|consistent|patterns?)\b/g,
  SPARK: /\b(light ?bulbs?|stars?|ideas?|insights?|lessons?|learned|realized|realised|secret|surprising|truth|lightbulb)\b/g,
};

/**
 * What each illustration means, for the strategist to choose from (it names
 * one; code checks the name is real). One line each, stated as when to use it,
 * because a picker reading literally needs the condition, not just a label.
 */
export const MOTIF_MEANING: Record<Motif, string> = {
  HOUSE: "a house: real estate, homes, listings, showings, brokerages",
  CALENDAR: "a calendar with one booked day: bookings, appointments, scheduling",
  WAVEFORM: "a sound wave: voice, phone calls, speech, listening",
  CHAT: "two speech bubbles: conversations, messages, replies, questions",
  DOCUMENT: "a page with a checklist: records, CRM data, notes, forms, schemas",
  MEGAPHONE: "a megaphone: marketing, reach, announcements, visibility",
  KEY: "a key: access, unlocking, the one answer that opens a problem",
  PEOPLE: "three people, one highlighted: teams, staff, humans versus AI, hiring",
  LINK: "two chain links: integrations, handoffs, systems connecting",
  FUNNEL: "a funnel: leads, qualification, conversion, prospects narrowing",
  CLOCK: "a clock with speed lines: speed, delay, latency, response time",
  SHIELD: "a shield with a check: trust, safety, compliance, guardrails",
  GEAR: "two gears: machinery, operations, settings, how something runs",
  FLOW: "connected nodes: workflows, automation, pipelines, agents passing work",
  BARS: "a rising bar chart: growth, metrics, results, revenue",
  BALANCE: "a scale: trade-offs, cost versus value, pricing",
  FORK: "a path that splits: a decision, a choice, a wrong turn",
  STEPS: "a staircase: stages, progress, a sequence of steps",
  LOOP: "a circular arrow: feedback loops, iteration, routines, follow-ups",
  TARGET: "a target with an arrow: focus, the ICP, goals, aiming at a buyer",
  STACK: "stacked layers: architecture, tools, software, the tech stack",
  GRID: "a dot grid with a few lit: scale, systems, consistency, patterns",
  SPARK: "a burst of light: an insight, a lesson, a surprising truth",
};

export const DOODLE_MEANING: Record<DoodleName, string> = {
  READING: "a person reading: learning, research",
  READING_SIDE: "a person reading, side view: studying a topic closely",
  SITTING_READING: "a person reading on a chair: documents, notes, guides",
  CLUMSY: "a person tripping: mistakes, failure, something broken",
  UNBOXING: "a person opening a box: a launch, something new",
  PLANT: "a person with a plant: growth, nurturing, compounding",
  MEDITATING: "a person meditating: focus, calm, simplicity",
  SPRINTING: "a person sprinting: speed, urgency",
  COFFEE: "a person with coffee: routines, daily habits",
  STROLLING: "a person walking: a journey, taking it step by step",
  SITTING: "a person sitting and thinking: reflection, a pause",
  JUMPING: "a person jumping: a win, a milestone",
  RUNNING: "a person running: momentum, competition, racing ahead",
  LAYING: "a person on their phone: social media, the feed, mobile",
  SELFIE: "a person taking a selfie: personal brand, visibility",
  LOVING: "a person with a heart: trust, care, relationships",
  FLOAT: "a person floating: ideas, imagination",
  CHILLING: "a person relaxing: automation doing the work, ease",
};

const DOODLE_WORDS: Partial<Record<DoodleName, RegExp>> = {
  CLUMSY: /\b(crossed[- ]out|mistakes?|wrong|fail|failed|fails|failure|broke|broken|mess|chaos|misspell\w*)\b/g,
  UNBOXING: /\b(launch|launched|ship|shipped|new|release|released|built|unveil)\b/g,
  JUMPING: /\b(wins?|won|celebrate|milestone|record|best)\b/g,
  SPRINTING: /\b(stopwatch|timers?|fast|faster|speed|quick|quickly|seconds|minutes|rush)\b/g,
  RUNNING: /\b(ahead|race|competitors?|compete|momentum|behind)\b/g,
  LAYING: /\b(scroll|scrolling|feed|linkedin|social|mobile|posts?)\b/g,
  SELFIE: /\b(brand|personal brand|content|followers|visibility|founder|creator)\b/g,
  LOVING: /\b(love|loves|trust|care|thank|gratitude|loyal|loyalty|relationships?)\b/g,
  READING: /\b(learn|learned|learning|lessons?|research|study|read|reading)\b/g,
  SITTING_READING: /\b(documents?|pages?|checklists?|book|books|notes|documentation|docs|guide)\b/g,
  FLOAT: /\b(ideas?|imagine|think|thinking|creative|curious|wonder)\b/g,
  PLANT: /\b(grow|growth|growing|compound|nurture)\b/g,
  MEDITATING: /\b(focus|calm|simple|simpler|simplicity|patience|less)\b/g,
  CHILLING: /\b(easy|effortless|relax|automatic|hands-off|autopilot)\b/g,
  COFFEE: /\b(morning|daily|routine|week|weekly|habit)\b/g,
};

const ICON_STOP = new Set(["what", "when", "with", "that", "their", "someone", "someone's", "from", "into", "they", "only", "being", "your", "left", "real", "right", "adding", "down", "things", "four", "title"]);

/** Words that point at an icon, from its name and its meaning: the fallback when the strategist names none. */
const ICON_WORDS = Object.fromEntries(
  (Object.entries(ICON_MEANING) as [IconName, string][]).map(([name, meaning]) => {
    const words = [...new Set([...name.toLowerCase().split("_"), ...meaning.toLowerCase().split(/[^a-z']+/)])].filter((w) => w.length >= 4 && !ICON_STOP.has(w));
    return [name, new RegExp(`\\b(${words.join("|")})s?\\b`, "g")];
  }),
) as Partial<Record<IconName, RegExp>>;

/** 32-bit FNV-1a: a stable number from a string. */
function hashSeed(s: string): number {
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
 * The illustration for a post, or null for NONE. `preferred` is the motif the
 * strategist named from the collection (MOTIF_MEANING / DOODLE_MEANING); a name
 * that is not in the collection is ignored. `hint` is the strategist's
 * one-sentence motif idea (thumbnail_card.physical_scene): it names the
 * picture the post is about, so its matches are tried first. `text` is the
 * headline, title and hook; `recent` the motifs of the tenant's last covers, newest
 * first. The best keyword match is used unless it was on one of the last two
 * covers (then the next match); with no usable match the post id picks one
 * not seen in the last three. `exclude` is the motif a reviewer asked to
 * replace, never returned.
 */
export function chooseArt(style: CoverArtStyle, text: string, seed: string, recent: string[] = [], exclude?: string, hint = "", preferred = ""): ArtChoice | null {
  if (style === "NONE") return null;
  const t = text.toLowerCase();
  const hinted = hint.toLowerCase();
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
  // The strategist's named pick first (when it is in the collection), then the
  // hint's keyword matches, then the post's own words.
  const want = preferred.trim().toUpperCase();
  const both = <K extends string>(words: Partial<Record<K, RegExp>>, all: readonly K[]) => [
    ...new Set([...(all.includes(want as K) ? [want as K] : []), ...ranked(hinted, words), ...ranked(t, words)]),
  ];
  if (style === "DOODLES") {
    const all = Object.keys(DOODLES) as DoodleName[];
    return { style, ...pick(both(DOODLE_WORDS, all), all) };
  }
  if (style === "ICONS") {
    const all = Object.keys(ICONS) as IconName[];
    return { style, ...pick(both(ICON_WORDS, all), all) };
  }
  return { style, ...pick(both(MOTIF_WORDS, MOTIFS), MOTIFS) };
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

/**
 * Every shape is drawn on one 600 x 300 canvas with one stroke weight and
 * round ends, in two colours (lines, and one highlight) plus tints of the
 * line colour, so the set reads as one family whichever the post gets.
 */
const W = 600;
const H = 300;
const S = 10;
const svg = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const r1 = (n: number) => Math.round(n * 10) / 10;
const line = (x1: number, y1: number, x2: number, y2: number, colour: string, extra = "", width = S) =>
  `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const dot = (cx: number, cy: number, r: number, fill: string, extra = "") => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${fill}" ${extra}/>`;
const ring = (cx: number, cy: number, r: number, c: ArtColours, extra = "") => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" ${extra}/>`;
const path = (d: string, colour: string, extra = "", width = S) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
/** n distinct integers below max. */
const pickN = (rnd: () => number, n: number, max: number) => {
  const out = new Set<number>();
  while (out.size < Math.min(n, max)) out.add(Math.floor(rnd() * max));
  return out;
};

type Draw = (rnd: () => number, c: ArtColours) => string;

const DRAW: Record<Motif, Draw> = {
  WAVEFORM: (rnd, c) => {
    const n = 25;
    const phase = rnd() * 6;
    const hi = pickN(rnd, 3, n);
    return Array.from({ length: n }, (_, i) => {
      const envelope = Math.sin((Math.PI * (i + 0.5)) / n) ** 0.7;
      const h = r1(24 + 250 * envelope * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.9 + phase))));
      return `<rect x="${i * 24 + 6}" y="${r1(H / 2 - h / 2)}" width="12" height="${h}" rx="6" fill="${hi.has(i) ? c.highlight : c.main}"/>`;
    }).join("");
  },
  CHAT: (rnd, c) => {
    const w = r1(270 + rnd() * 40);
    const back = `<path d="M 70 30 H ${40 + w} Q ${70 + w} 30 ${70 + w} 60 V 150 Q ${70 + w} 180 ${40 + w} 180 H 140 L 84 222 V 180 H 70 Q 40 180 40 150 V 60 Q 40 30 70 30 Z" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" stroke-linejoin="round"/>`;
    const dots = [0, 1, 2].map((i) => dot(110 + i * 46, 105, 13, c.main)).join("");
    const front = `<path d="M 290 128 H 530 Q 560 128 560 158 V 228 Q 560 258 530 258 H 516 V 294 L 470 258 H 290 Q 260 258 260 228 V 158 Q 260 128 290 128 Z" fill="${c.highlight}"/>`;
    const text = [0, 1].map((i) => `<rect x="296" y="${170 + i * 38}" width="${i ? 150 : 228}" height="14" rx="7" fill="${c.bg}"/>`).join("");
    return back + dots + front + text;
  },
  FUNNEL: (rnd, c) => {
    // Many leads arrive in loose rows, a few pass, one comes out.
    const inbound = Array.from({ length: 16 }, (_, i) =>
      dot(40 + (i % 4) * 46 + (rnd() - 0.5) * 14, 45 + Math.floor(i / 4) * 70 + (rnd() - 0.5) * 14, 10, c.main, `opacity="${r1(0.25 + (i % 4) * 0.15)}"`)
    ).join("");
    const shape = path("M 220 30 L 420 122 L 580 122", c.main) + path("M 220 270 L 420 178 L 580 178", c.main);
    const inside = [0, 1, 2].map((i) => dot(270 + i * 45, 150 + (rnd() - 0.5) * (80 - i * 30), 9, c.main, `opacity="0.55"`)).join("");
    return inbound + shape + inside + dot(525, 150, 22, c.highlight);
  },
  CLOCK: (rnd, c) => {
    const cx = 430;
    const cy = 150;
    const r = 120;
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      const inner = i % 3 === 0 ? r - 30 : r - 20;
      return line(cx + inner * Math.sin(a), cy - inner * Math.cos(a), cx + (r - 12) * Math.sin(a), cy - (r - 12) * Math.cos(a), c.main, `opacity="${i % 3 === 0 ? 0.9 : 0.4}"`);
    }).join("");
    const a = 0.6 + rnd() * 1.6;
    const hand = line(cx, cy, cx + 78 * Math.sin(a), cy - 78 * Math.cos(a), c.highlight, "", 14);
    const speed = [100, 150, 200].map((y, i) => line(40 + i * 30 + rnd() * 20, y, 250 - i * 10, y, c.main, `opacity="${r1(0.35 + i * 0.2)}"`)).join("");
    return speed + ring(cx, cy, r, c) + ticks + line(cx, cy, cx, cy - 92, c.main) + hand + dot(cx, cy, 14, c.main);
  },
  SHIELD: (rnd, c) => {
    const shield = `<path d="M 300 20 L 425 62 V 148 C 425 220 372 262 300 288 C 228 262 175 220 175 148 V 62 Z" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" stroke-linejoin="round"/>`;
    const check = path("M 248 152 L 287 190 L 358 112", c.highlight, "", 18);
    const sides = [110, 150, 190]
      .map((y, i) => line(40 + i * 15, y, 125 - rnd() * 20, y, c.main, `opacity="0.3"`) + line(475 + rnd() * 20, y, 560 - i * 15, y, c.main, `opacity="0.3"`))
      .join("");
    return sides + shield + check;
  },
  FLOW: (rnd, c) => {
    const n = 5;
    const pts = Array.from({ length: n }, (_, i) => [45 + i * 127, r1(60 + rnd() * 180)]);
    const hi = 1 + Math.floor(rnd() * (n - 1));
    const lines = pts.slice(1).map((p, i) => line(pts[i][0], pts[i][1], p[0], p[1], c.main)).join("");
    return lines + pts.map((p, i) => (i === hi ? dot(p[0], p[1], 38, c.highlight) : ring(p[0], p[1], 26, c))).join("");
  },
  BARS: (rnd, c) => {
    const n = 6;
    const bars = Array.from({ length: n }, (_, i) => {
      const h = r1(60 + (200 * (i + 1)) / n - rnd() * 30);
      const last = i === n - 1;
      return `<rect x="${24 + i * 96}" y="${r1(280 - h)}" width="64" height="${h}" rx="10" fill="${last ? c.highlight : c.main}" opacity="${last ? 1 : r1(0.3 + (0.55 * i) / n)}"/>`;
    }).join("");
    return bars + line(10, 292, 590, 292, c.main, `opacity="0.4"`, 6);
  },
  BALANCE: (rnd, c) => {
    const t = (6 + rnd() * 6) * (Math.PI / 180);
    const [px, py, arm] = [300, 70, 210];
    const [lx, ly, rx, ry] = [px - arm * Math.cos(t), py + arm * Math.sin(t), px + arm * Math.cos(t), py - arm * Math.sin(t)];
    const pan = (x: number, y: number) => path(`M ${r1(x - 50)} ${r1(y + 70)} L ${r1(x)} ${r1(y)} L ${r1(x + 50)} ${r1(y + 70)}`, c.main, `opacity="0.5"`, 6) + path(`M ${r1(x - 62)} ${r1(y + 70)} A 62 34 0 0 0 ${r1(x + 62)} ${r1(y + 70)} Z`, c.main);
    return (
      line(px, py, px, 285, c.main) +
      line(240, 288, 360, 288, c.main) +
      line(lx, ly, rx, ry, c.main) +
      pan(lx, ly) +
      pan(rx, ry) +
      dot(lx, ly + 58, 30, c.highlight) +
      `<rect x="${r1(rx - 16)}" y="${r1(ry + 44)}" width="32" height="32" rx="6" fill="${c.main}" opacity="0.6"/>` +
      dot(px, py, 14, c.main)
    );
  },
  FORK: (rnd, c) => {
    const split = r1(210 + rnd() * 60);
    const [up, down] = [r1(50 + rnd() * 20), r1(250 - rnd() * 20)];
    const curve = (y: number) => `M ${split} 150 C ${split + 150} 150, ${split + 130} ${y}, 530 ${y}`;
    return (
      line(40, 150, split, 150, c.main) +
      path(curve(down), c.main, `stroke-dasharray="2 22" opacity="0.5"`) +
      path(curve(up), c.main) +
      dot(40, 150, 16, c.main) +
      ring(552, down, 20, c, `opacity="0.5"`) +
      dot(552, up, 30, c.highlight)
    );
  },
  STEPS: (rnd, c) => {
    const rise = 44;
    const run = r1(88 + rnd() * 8);
    let d = `M 30 285`;
    for (let i = 0; i < 5; i++) d += ` H ${r1(30 + run * (i + 1))} V ${285 - rise * (i + 1)}`;
    d += ` H 570`;
    const top = 285 - rise * 5;
    const ghosts = [1, 2, 3].map((i) => dot(30 + run * i + run / 2, 285 - rise * i - 26, 10, c.main, `opacity="${r1(0.2 + i * 0.12)}"`)).join("");
    return path(d, c.main) + ghosts + dot(r1(Math.min(540, 30 + run * 5 + 40)), top - 34, 26, c.highlight);
  },
  LOOP: (rnd, c) => {
    const [cx, cy, r] = [150, 150, 110];
    const a0 = -Math.PI / 2 + 0.4;
    const a1 = a0 + Math.PI * 1.7;
    const [x0, y0, x1, y1] = [cx + r * Math.cos(a0), cy + r * Math.sin(a0), cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    const tip = `${r1(x1 + 30)},${r1(y1 - 2)} ${r1(x1 - 4)},${r1(y1 - 34)} ${r1(x1 - 10)},${r1(y1 + 14)}`;
    const trail = Array.from({ length: 5 }, (_, i) => `<rect x="${310 + i * 56}" y="${r1(130 - rnd() * 8)}" width="38" height="${r1(40 + rnd() * 10)}" rx="10" fill="${i === 4 ? c.highlight : c.main}" opacity="${i === 4 ? 1 : r1(0.2 + i * 0.15)}"/>`).join("");
    return `<path d="M ${r1(x0)} ${r1(y0)} A ${r} ${r} 0 1 1 ${r1(x1)} ${r1(y1)}" fill="none" stroke="${c.main}" stroke-width="${S}" stroke-linecap="round"/><polygon points="${tip}" fill="${c.main}"/>` + dot(cx, cy, 24, c.highlight) + trail;
  },
  TARGET: (rnd, c) => {
    const [cx, cy] = [170, 150];
    const rings = [130, 96, 62].map((r, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.main}" stroke-width="${S}" opacity="${r1(0.35 + i * 0.3)}"/>`).join("");
    const [sx, sy] = [560, r1(40 + rnd() * 50)];
    const ang = Math.atan2(sy - cy, sx - cx);
    const fletch = [-0.5, 0.5].map((d) => line(sx, sy, sx - 36 * Math.cos(ang + Math.PI + d), sy - 36 * Math.sin(ang + Math.PI + d), c.main)).join("");
    return rings + line(sx, sy, cx + 24 * Math.cos(ang), cy + 24 * Math.sin(ang), c.main) + fletch + dot(cx, cy, 28, c.highlight);
  },
  STACK: (rnd, c) => {
    const n = 4;
    const hi = n - 1 - Math.floor(rnd() * 2);
    return Array.from({ length: n }, (_, i) => {
      const [x, y] = [40 + i * 60, 196 - i * 56];
      const lit = i === hi;
      return `<rect x="${x}" y="${y}" width="${r1(310 + rnd() * 30)}" height="84" rx="18" fill="${lit ? c.highlight : c.bg}" stroke="${lit ? c.highlight : c.main}" stroke-width="${S}"/>`;
    }).join("");
  },
  GRID: (rnd, c) => {
    const [cols, rows] = [13, 6];
    const lit = pickN(rnd, 4, cols * rows);
    let out = "";
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const [cx, cy] = [24 + x * 46, 25 + y * 50];
        out += lit.has(y * cols + x) ? dot(cx, cy, 17, c.highlight) : dot(cx, cy, 8, c.main, `opacity="${r1(0.3 + rnd() * 0.5)}"`);
      }
    return out;
  },
  SPARK: (rnd, c) => {
    const [cx, cy] = [300, 150];
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6 + 0.1;
      const len = i % 2 ? 36 + rnd() * 20 : 60 + rnd() * 30;
      return line(cx + 72 * Math.cos(a), cy + 72 * Math.sin(a), cx + (72 + len) * Math.cos(a), cy + (72 + len) * Math.sin(a), c.main, `opacity="${i % 2 ? 0.45 : 0.9}"`);
    }).join("");
    const orbit = Array.from({ length: 6 }, () => dot(40 + rnd() * 520, 20 + rnd() * 260, 5 + rnd() * 4, c.main, `opacity="0.3"`)).join("");
    return orbit + rays + dot(cx, cy, 44, c.highlight);
  },
  HOUSE: (rnd, c) => {
    // A house with its door lit; a few dots (buyers) walk up the path.
    const walk = [0, 1, 2].map((i) => dot(60 + i * 44, 272 - i * 4 + (rnd() - 0.5) * 6, 9, c.main, `opacity="${r1(0.25 + i * 0.2)}"`)).join("");
    const body = `<path d="M 205 140 V 284 H 395 V 140" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" stroke-linejoin="round"/>`;
    const roof = path("M 170 158 L 300 44 L 430 158", c.main) + line(370, 104, 370, 62, c.main);
    const win = (x: number) => `<rect x="${x}" y="168" width="40" height="40" rx="6" fill="${c.bg}" stroke="${c.main}" stroke-width="6" opacity="0.7"/>`;
    const door = `<rect x="275" y="${r1(206 + rnd() * 4)}" width="50" height="78" rx="8" fill="${c.highlight}"/>`;
    return walk + body + roof + win(222) + win(338) + door + line(130, 290, 470, 290, c.main, `opacity="0.4"`, 6);
  },
  CALENDAR: (rnd, c) => {
    const [x, y, w, h] = [150, 44, 300, 244];
    const frame = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}"/>`;
    const header = line(x, y + 62, x + w, y + 62, c.main) + line(x + 76, y - 22, x + 76, y + 20, c.main) + line(x + w - 76, y - 22, x + w - 76, y + 20, c.main);
    const lit = Math.floor(rnd() * 21);
    const cells = Array.from({ length: 21 }, (_, i) => {
      const [cx, cy] = [x + 42 + (i % 7) * 36, y + 104 + Math.floor(i / 7) * 50];
      return i === lit ? `<rect x="${cx - 18}" y="${cy - 18}" width="36" height="36" rx="9" fill="${c.highlight}"/>` : dot(cx, cy, 8, c.main, `opacity="0.35"`);
    }).join("");
    const sides = [110, 190].map((yy) => line(50, yy, 110, yy, c.main, `opacity="0.3"`) + line(490, yy, 550, yy, c.main, `opacity="0.3"`)).join("");
    return sides + frame + header + cells;
  },
  DOCUMENT: (rnd, c) => {
    const back = `<rect x="238" y="14" width="200" height="250" rx="16" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" opacity="0.35"/>`;
    const page = `<path d="M 180 40 H 330 L 380 90 V 288 H 180 Z" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" stroke-linejoin="round"/>` + path("M 330 40 V 90 H 380", c.main);
    const hi = Math.floor(rnd() * 4);
    const rows = [0, 1, 2, 3].map((i) => {
      const yy = 128 + i * 42;
      const box = i === hi
        ? `<rect x="200" y="${yy - 15}" width="30" height="30" rx="7" fill="${c.highlight}"/>` + path(`M 207 ${yy} L 213 ${yy + 7} L 224 ${yy - 7}`, c.bg, "", 5)
        : `<rect x="200" y="${yy - 15}" width="30" height="30" rx="7" fill="none" stroke="${c.main}" stroke-width="6" opacity="0.6"/>`;
      return box + line(248, yy, r1(350 - rnd() * 50), yy, c.main, `opacity="0.5"`, 8);
    }).join("");
    return back + page + rows;
  },
  KEY: (rnd, c) => {
    const cy = r1(150 + (rnd() - 0.5) * 20);
    const head = `<circle cx="170" cy="${cy}" r="74" fill="${c.highlight}"/>` + dot(170, cy, 28, c.bg);
    const shaft = line(244, cy, 530, cy, c.main, "", 16);
    const teeth = line(450, cy, 450, cy + 52, c.main, "", 16) + line(500, cy, 500, cy + 38, c.main, "", 16);
    return shaft + teeth + head;
  },
  PEOPLE: (rnd, c) => {
    // One figure in front and highlighted, two behind it.
    const person = (cx: number, top: number, scale: number, lit: boolean, opacity: number) => {
      const r = 36 * scale;
      const head = lit ? dot(cx, top + r, r, c.highlight) : `<circle cx="${cx}" cy="${r1(top + r)}" r="${r1(r)}" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" opacity="${opacity}"/>`;
      const w = 72 * scale;
      const y0 = top + 2 * r + 18;
      const body = `<path d="M ${r1(cx - w)} 286 C ${r1(cx - w)} ${r1(y0)}, ${r1(cx + w)} ${r1(y0)}, ${r1(cx + w)} 286" fill="${lit ? c.highlight : c.bg}" stroke="${lit ? c.highlight : c.main}" stroke-width="${S}" opacity="${opacity}"/>`;
      return body + head;
    };
    const lift = r1(rnd() * 10);
    return person(165, 80 + lift, 0.85, false, 0.5) + person(435, 80 - lift, 0.85, false, 0.5) + person(300, 40, 1.05, true, 1);
  },
  LINK: (rnd, c) => {
    const tilt = r1((rnd() - 0.5) * 8);
    const left = `<rect x="90" y="108" width="240" height="88" rx="44" fill="none" stroke="${c.main}" stroke-width="${S * 1.6}" transform="rotate(${tilt} 300 150)"/>`;
    const right = `<rect x="270" y="108" width="240" height="88" rx="44" fill="none" stroke="${c.highlight}" stroke-width="${S * 1.6}" transform="rotate(${tilt} 300 150)"/>`;
    const ends = dot(40, 150, 12, c.main, `opacity="0.4"`) + dot(560, 150, 12, c.main, `opacity="0.4"`);
    return ends + left + right;
  },
  MEGAPHONE: (rnd, c) => {
    const cone = `<path d="M 200 118 L 380 48 V 252 L 200 182 Z" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" stroke-linejoin="round"/>`;
    const mouth = `<rect x="148" y="112" width="52" height="76" rx="12" fill="${c.main}"/>` + line(236, 196, 258, 266, c.main, "", 14);
    const waves = [0, 1, 2].map((i) => {
      const x = 418 + i * 42;
      const hh = 44 + i * 30 + rnd() * 8;
      return path(`M ${x} ${r1(150 - hh)} Q ${x + 34} 150 ${x} ${r1(150 + hh)}`, i === 0 ? c.highlight : c.main, `opacity="${i === 0 ? 1 : r1(0.7 - i * 0.2)}"`);
    }).join("");
    return mouth + cone + waves;
  },
  GEAR: (rnd, c) => {
    const gear = (cx: number, cy: number, r: number, teeth: number, turn: number, lit: boolean, opacity: number) => {
      const t = Array.from({ length: teeth }, (_, i) => {
        const a = turn + (i * 2 * Math.PI) / teeth;
        return line(cx + (r - 6) * Math.cos(a), cy + (r - 6) * Math.sin(a), cx + (r + 26) * Math.cos(a), cy + (r + 26) * Math.sin(a), c.main, `opacity="${opacity}"`, 24);
      }).join("");
      const body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.bg}" stroke="${c.main}" stroke-width="${S}" opacity="${opacity}"/>`;
      return t + body + dot(cx, cy, r * 0.38, lit ? c.highlight : c.main, lit ? "" : `opacity="${opacity}"`);
    };
    const turn = rnd() * Math.PI;
    return gear(420, 104, 52, 8, turn, false, 0.5) + gear(240, 170, 86, 10, -turn, true, 1);
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
  if (choice.style === "ICONS") {
    const { viewBox, body } = ICONS[choice.motif];
    const [, , w, h] = viewBox.split(" ").map(Number);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w * 2}" height="${h * 2}"><g fill="${c.highlight}">${body}</g></svg>`, aspect: w / h };
  }
  const rnd = random(hashSeed(`${seed}:${choice.motif}`));
  return { svg: svg(W, H, DRAW[choice.motif](rnd, c)), aspect: W / H };
}

/** The illustration as a data URL for the cover renderer, and its width / height. */
export function drawArt(choice: ArtChoice, seed: string, c: ArtColours): { src: string; aspect: number } {
  const { svg: s, aspect } = artSvg(choice, seed, c);
  return { src: dataUrl(s), aspect };
}
