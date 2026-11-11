/**
 * Cover copy and layout, chosen and scored in code (phase 5 of
 * docs/product/authority-flywheel-plan.md). The strategist proposes a cover
 * card; code decides what reaches the cover:
 *
 *  - Every figure on a cover must appear in the final draft body, and a NUMBER
 *    cover is never used on a BLOCKED draft (the draft check found an invented
 *    figure). A QUOTE is always a sentence taken word for word from the body.
 *  - A headline is scored for clarity, mobile length and ICP relevance; it
 *    must set in three lines at feed size. The cover line written from the
 *    finished post (3-6 words, two large lines) comes first; a failing one
 *    falls back to the strategist's headline, then the article title, never
 *    to invented text.
 *  - A cover makes one point at a glance. HEADLINE and STATEMENT carry it by
 *    default and alternate per tenant; a NUMBER or QUOTE is used only when
 *    the service judged it understandable without the post and clearer than
 *    the headline (judged), never just because it is its turn.
 */
import { contentWords, numbersIn, sharedWords } from "@/lib/harvest/text";
import { headlineFits, type CoverLayout } from "./layouts";
import type { PosterShape } from "./shape";

export interface CoverCard {
  headline?: string;
  /** A 3-6 word line written from the finished post (checkCoverLine); preferred over the headline. */
  cover_line?: string;
  subtitle?: string;
  /** One word of the headline to set in the accent colour. */
  emphasis_word?: string;
  /** Optional big figure: code uses it only if the body states it. */
  number?: { value?: string; unit?: string; caption?: string };
  /** The strategist's one-sentence motif idea: steers which illustration is drawn. */
  physical_scene?: string;
  /** The illustration the strategist named from each collection; used when the name is real. */
  shape_motif?: string;
  doodle_motif?: string;
  icon_motif?: string;
  /** What the post holds that a poster can show (shape.ts), read once per draft; absent until read. */
  shape?: PosterShape;
}

export interface CoverCopyInput {
  card: CoverCard;
  title: string;
  hook: string;
  body: string;
  /**
   * The LinkedIn post text, when the draft has one. The cover is seen beside
   * it, so a quote comes from it: a line the reader never sees in the post
   * would read as invented.
   */
  post?: string;
  claimsOk: string;
  icp: { who: string; role: string; company_type: string };
  /** Layouts of this tenant's recent covers, newest first. */
  recentLayouts: string[];
  /** Draw this layout, skipping the figure and quote picks (the first post's cover). */
  layout?: "STATEMENT";
  /**
   * Whether the figure or the quote (coverOptions) makes the post's point on
   * its own and better than the headline. Missing means no: the headline wins.
   */
  judged?: { number?: boolean; quote?: boolean };
}

export interface HeadlineScore {
  words: number;
  /** 1 for 3-6 words, 0.5 for 7-9, 0 otherwise. */
  length: number;
  /** Shares at least one content word with the ICP. */
  icp_relevant: boolean;
  /** The reasons it was refused; empty when usable. */
  problems: string[];
}

export interface CoverCopy {
  layout: CoverLayout;
  label?: string;
  headline: string;
  emphasis?: string;
  kicker?: string;
  quote?: string;
  number?: { value: string; unit?: string };
  headline_source: "cover_line" | "strategist" | "title";
  score: HeadlineScore;
  /** Why an option was not used, for the reviewer and the cover eval. */
  notes: string[];
}

/** Explainer framing and category pairs: a cover must say what the post is about, not name a category. */
const VAGUE = /\b(vs\.?|versus|explained|understanding|a look at|an introduction|introduction to|the future of|everything you need|deep dive|all about)\b/i;
const MAX_WORDS = 11;
/** A subtitle under a longer headline crowds the cover; the headline carries the post alone. */
const KICKER_HEADLINE_WORDS = 8;
const KICKER_CHARS = 90;

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean);
const clean = (t: string | undefined) => (t ?? "").replace(/\s+/g, " ").replace(/[—–]/g, ", ").trim();

/** ALL CAPS copy (the old image prompt asked for it) reads as shouting in type; set it in sentence case. */
function sentenceCase(t: string): string {
  if (t !== t.toUpperCase() || !/[A-Z]{3}/.test(t)) return t;
  const lower = t.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Figures in cover text that the body never states. Cover text may not add a figure. */
export function newFigures(text: string, body: string): string[] {
  const inBody = new Set(numbersIn(body));
  return numbersIn(text).filter((n) => !inBody.has(n));
}

export function scoreHeadline(headline: string, input: Pick<CoverCopyInput, "body" | "icp">): HeadlineScore {
  const n = words(headline).length;
  const problems: string[] = [];
  if (n < 3) problems.push(`only ${n} word(s)`);
  if (n > MAX_WORDS) problems.push(`${n} words, over ${MAX_WORDS}`);
  else if (n >= 3 && !headlineFits(headline)) problems.push("too long to set in three lines at feed size");
  if (VAGUE.test(headline)) problems.push("names a topic instead of making a claim");
  const figures = newFigures(headline, input.body);
  if (figures.length) problems.push(`states ${figures.join(", ")}, which the draft does not`);
  const icpText = `${input.icp.who} ${input.icp.role} ${input.icp.company_type}`;
  return {
    words: n,
    length: n >= 3 && n <= 6 ? 1 : n >= 7 && n <= 9 ? 0.5 : 0,
    icp_relevant: icpText.trim() ? sharedWords(headline, icpText) > 0 : false,
    problems,
  };
}

/** A cover line is read in about a second: a few words, set large in two lines. */
export const COVER_LINE_WORDS = [3, 6] as const;
const COVER_LINE_CHARS = 40;
/** On the 1080 canvas; about 30px in the feed, a quarter larger than the smallest headline. */
const COVER_LINE_MIN_SIZE = 90;

/**
 * Why a cover line cannot be used, or null when it can: 3-6 words, at most 40
 * characters, sets in two lines at 90px or more, claims something, and
 * states no figure the draft does not.
 */
export function checkCoverLine(line: string, body: string): string | null {
  const text = clean(line).replace(/[.]+$/, "");
  const n = words(text).length;
  if (n < COVER_LINE_WORDS[0] || n > COVER_LINE_WORDS[1]) return `${n} words, not ${COVER_LINE_WORDS.join("-")}`;
  if (text.length > COVER_LINE_CHARS) return `${text.length} characters, over ${COVER_LINE_CHARS}`;
  if (/[:#]|https?:/.test(text) || VAGUE.test(text)) return "a label, not a claim";
  const figures = newFigures(text, body);
  if (figures.length) return `states ${figures.join(", ")}, which the draft does not`;
  if (!headlineFits(text, COVER_LINE_MIN_SIZE, 2)) return "does not set in two large lines";
  return null;
}

/**
 * The cover line to use from Jev's ratings: the clearest one, when it is clear
 * enough. It does not have to beat the long title: a poster carries a short,
 * punchy line, and a long title always reads "clear" (user decision, 2026-11-11).
 * "" when none is clear enough.
 */
export function pickCoverLine(rated: { l: string; p: number }[], _titleP: number, minClear: number): string {
  const best = [...rated].sort((a, b) => b.p - a.p)[0];
  return best && best.p >= minClear ? best.l : "";
}

/** "For real estate brokerages and teams": who the post is for, from the ICP. */
export function audienceLabel(icp: CoverCopyInput["icp"]): string | undefined {
  const who = clean(icp.company_type) || clean(icp.role);
  if (!who) return undefined;
  const text = /^for\b/i.test(who) ? who : `For ${who.charAt(0).toLowerCase()}${who.slice(1)}`;
  return text.length <= 40 ? text : undefined;
}

function pickEmphasis(headline: string, proposed: string | undefined): string | undefined {
  const key = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
  const ws = words(headline);
  if (proposed && ws.some((w) => key(w) === key(proposed))) return proposed;
  // Otherwise the longest content word: usually the specific noun the claim turns on.
  const candidates = ws.filter((w) => contentWords(w).size > 0);
  return candidates.sort((a, b) => key(b).length - key(a).length)[0];
}

const sentencesOf = (text: string) =>
  text
    .replace(/^#{1,6}\s.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .split(/\n\s*\n/)
    .flatMap((p) => p.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z"'])/))
    .map((s) => s.trim())
    .filter(Boolean);

const CONTRAST = /\b(not|never|only|instead|without|until|nothing|rather)\b/i;
/**
 * A pull quote is read with no context, so it cannot open on a word that
 * points back at the paragraph before it ("Not because...", "They miss...").
 */
const LEANS_ON_CONTEXT = /^(not|but|and|or|so|because|which|that|this|these|those|it|its|it's|they|them|their|then|also|yet|still|instead|here|there|he|she|such)\b/i;

/** A longer quote does not set in four lines at a size the feed can read. */
const QUOTE_WORDS = 18;

/**
 * The most quotable sentence of the body, word for word: 7-18 words, no
 * figures, not a question, no markdown, and able to stand alone. Contrast ("not X. It is Y") and a
 * place in the closing paragraphs make a line quotable. A short run of two
 * sentences is allowed when the second completes the first.
 */
export function pickQuote(body: string): string | undefined {
  const all = sentencesOf(body);
  const candidates: { text: string; score: number; at: number }[] = [];
  all.forEach((s, i) => {
    const pair = all[i + 1] && words(s).length <= 12 ? `${s} ${all[i + 1]}` : undefined;
    for (const text of pair ? [s, pair] : [s]) {
      const n = words(text).length;
      if (n < 7 || n > QUOTE_WORDS || /\d/.test(text) || /[?*_`#[\]]/.test(text) || LEANS_ON_CONTEXT.test(text)) continue;
      let score = CONTRAST.test(text) ? 2 : 0;
      if (i >= all.length - 4) score += 1;
      if (n >= 10 && n <= 18) score += 1;
      candidates.push({ text, score, at: i });
    }
  });
  // On a tie the later line wins: a closing line is the one people quote.
  const best = candidates.sort((a, b) => b.score - a.score || b.at - a.at)[0];
  return best && best.score >= 2 ? best.text : undefined;
}

function pickNumber(card: CoverCard, body: string, claimsOk: string, notes: string[]): { number: { value: string; unit?: string }; caption: string } | undefined {
  const value = clean(card.number?.value);
  const caption = clean(card.number?.caption);
  if (!value || !caption) return undefined;
  if (claimsOk === "BLOCKED") {
    notes.push("No NUMBER cover: the draft check blocked this draft.");
    return undefined;
  }
  const missing = newFigures(`${value} ${caption}`, body);
  if (missing.length || !numbersIn(value).length) {
    notes.push(`No NUMBER cover: ${value} is not stated in the draft.`);
    return undefined;
  }
  return { number: { value, unit: clean(card.number?.unit) || undefined }, caption };
}

/** A draft's body without the cover image line at its top. */
export const bodyOf = (content: string) => content.replace(/^!\[[^\]]*\]\([^)]*\)\s*/, "");

/** Where a cover quote is taken from: the LinkedIn post when there is one, else the body. */
export const quoteSource = (draft: { body: string; post?: string | null }) => draft.post?.trim() || draft.body;

/**
 * The figure and the quote this draft could open with, before anyone judges
 * whether they make the point on their own (the service asks Jev).
 */
export function coverOptions(input: Pick<CoverCopyInput, "card" | "body" | "post" | "claimsOk">): { number?: { value: string; unit?: string; caption: string }; quote?: string } {
  const picked = pickNumber(input.card, input.body, input.claimsOk, []);
  return { number: picked ? { ...picked.number, caption: picked.caption } : undefined, quote: pickQuote(quoteSource(input)) };
}

/**
 * Least recently used first, ties broken by the order of `available` (most
 * preferred first); never the tenant's last layout when another is possible.
 */
export function pickLayout(available: CoverLayout[], recent: string[]): CoverLayout {
  const lastUse = (l: CoverLayout) => {
    const i = recent.indexOf(l);
    return i < 0 ? Infinity : i;
  };
  const order = [...available].sort((a, b) => lastUse(b) - lastUse(a) || available.indexOf(a) - available.indexOf(b));
  return order.find((l) => l !== recent[0]) ?? order[0];
}

export function chooseCoverCopy(input: CoverCopyInput): CoverCopy {
  const notes: string[] = [];
  const coverLine = input.card.cover_line && !checkCoverLine(input.card.cover_line, input.body) ? input.card.cover_line : "";
  const options = [
    { text: sentenceCase(clean(coverLine).replace(/[.]+$/, "")), source: "cover_line" as const },
    { text: sentenceCase(clean(input.card.headline)), source: "strategist" as const },
    { text: sentenceCase(clean(input.title)), source: "title" as const },
  ]
    .filter((o) => o.text)
    .map((o) => ({ ...o, score: scoreHeadline(o.text, input) }));
  // The first that passes; else the first that states no figure the draft
  // does not (a long headline is still drawn, smaller); else the title.
  const chosen = options.find((o) => !o.score.problems.length) ?? options.find((o) => !o.score.problems.some((p) => p.startsWith("states "))) ?? options[options.length - 1];
  const strategist = options.find((o) => o.source === "strategist");
  if (strategist && strategist !== chosen && strategist.score.problems.length) notes.push(`Strategist headline not used: ${strategist.score.problems.join("; ")}.`);
  const headline = chosen?.text ?? "";
  const source: CoverCopy["headline_source"] = chosen?.source ?? "title";
  const score = chosen?.score ?? scoreHeadline(headline, input);

  let kicker = clean(input.card.subtitle);
  if (kicker && (kicker.length > KICKER_CHARS || newFigures(kicker, input.body).length || VAGUE.test(kicker))) {
    notes.push("Strategist subtitle not used: too long, vague, or states a figure the draft does not.");
    kicker = "";
  } else if (kicker && words(headline).length > KICKER_HEADLINE_WORDS) {
    notes.push("No subtitle: the headline carries the post, and both would be too small to read in the feed.");
    kicker = "";
  }

  const numbered = input.layout ? undefined : pickNumber(input.card, input.body, input.claimsOk, notes);
  const quote = input.layout ? undefined : pickQuote(quoteSource(input));
  if (numbered && !input.judged?.number) notes.push(`No NUMBER cover: ${numbered.number.value} ${numbered.caption} needs the post to make sense, or says less than the headline.`);
  if (quote && !input.judged?.quote) notes.push("No QUOTE cover: the line needs the post to make sense, or says less than the headline.");
  // A figure or quote that makes the point on its own leads, unless the last
  // cover used that layout. Otherwise the headline carries the cover, dark
  // STATEMENT before HEADLINE, alternating (user decisions, 2026-10-01 and 2026-10-03).
  const strong: CoverLayout[] = [...(numbered && input.judged?.number ? (["NUMBER"] as const) : []), ...(quote && input.judged?.quote ? (["QUOTE"] as const) : [])];
  const layout = input.layout ?? strong.find((l) => l !== input.recentLayouts[0]) ?? pickLayout(["STATEMENT", "HEADLINE"], input.recentLayouts);

  // The verified figure is kept whatever the layout, so a reviewer can switch to it.
  const base = { layout, label: audienceLabel(input.icp), headline_source: source, score, notes, ...(numbered ? { number: numbered.number } : {}) };
  if (layout === "NUMBER" && numbered) {
    return { ...base, headline: numbered.caption, emphasis: pickEmphasis(numbered.caption, undefined) };
  }
  if (layout === "QUOTE" && quote) return { ...base, headline, quote };
  return { ...base, headline, emphasis: pickEmphasis(headline, input.card.emphasis_word), kicker: kicker || undefined };
}

const squash = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Why a drawn cover no longer matches its draft, or null when it still does:
 * its quote left the body, it states a figure the body no longer does, or it
 * shows a title the draft has since changed. A reviewer's own headline counts
 * as current while its figures are.
 */
export function coverOutOfDate(
  cover: {
    layout?: string;
    headline?: string;
    kicker?: string;
    quote?: string;
    number?: { value: string } | null;
    headline_source?: string;
    list?: string[];
    grid?: { label: string }[];
    punch?: { lines: string[]; checks: string[] };
  },
  draft: { title: string; body: string; post?: string | null }
): string | null {
  if (cover.quote && cover.layout === "QUOTE" && !squash(quoteSource(draft)).includes(squash(cover.quote))) return "its quote is not in the post";
  // A poster's items are on the cover only in their own layout.
  const items = cover.layout === "LIST" ? cover.list : cover.layout === "GRID" ? cover.grid?.map((g) => g.label) : cover.layout === "PUNCH" && cover.punch ? [...cover.punch.lines, ...cover.punch.checks] : [];
  const text = [cover.headline, cover.kicker, cover.layout === "NUMBER" ? cover.number?.value : "", ...(items ?? [])].filter(Boolean).join(" ");
  const figures = newFigures(text, draft.body);
  if (figures.length) return `it states ${figures.join(", ")}, which the post no longer does`;
  if (cover.headline_source === "title" && cover.headline && squash(cover.headline) !== squash(draft.title)) return "its headline is the post's old title";
  return null;
}
