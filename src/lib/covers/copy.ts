/**
 * Cover copy and layout, chosen and scored in code (phase 5 of
 * docs/product/authority-flywheel-plan.md). The strategist proposes a cover
 * card; code decides what reaches the cover:
 *
 *  - Every figure on a cover must appear in the final draft body, and a NUMBER
 *    cover is never used on a BLOCKED draft (the draft check found an invented
 *    figure). A QUOTE is always a sentence taken word for word from the body.
 *  - A headline is scored for clarity, mobile length and ICP relevance; a
 *    failing one falls back to the article title, never to invented text.
 *  - Layouts rotate per tenant, so a run of posts keeps rhythm while the frame
 *    (type, paper, signature) stays constant.
 */
import { contentWords, numbersIn, sharedWords } from "@/lib/harvest/text";
import type { CoverLayout } from "./layouts";

export interface CoverCard {
  headline?: string;
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
}

export interface CoverCopyInput {
  card: CoverCard;
  title: string;
  hook: string;
  body: string;
  claimsOk: string;
  icp: { who: string; role: string; company_type: string };
  /** Layouts of this tenant's recent covers, newest first. */
  recentLayouts: string[];
  /** Draw this layout, skipping the figure and quote picks (the first post's cover). */
  layout?: "STATEMENT";
}

export interface HeadlineScore {
  words: number;
  /** 1 for 6-10 words, 0.5 for 4-5 or 11-12, 0 otherwise. */
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
  headline_source: "strategist" | "title";
  score: HeadlineScore;
  /** Why an option was not used, for the reviewer and the cover eval. */
  notes: string[];
}

/** Explainer framing and category pairs: a cover must make a claim, not name a topic. */
const VAGUE = /\b(vs\.?|versus|explained|understanding|a look at|an introduction|introduction to|the future of|everything you need|deep dive|all about)\b/i;
const MAX_WORDS = 14;

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean);
const clean = (t: string | undefined) => (t ?? "").replace(/\s+/g, " ").replace(/[—–]/g, ", ").trim();

/** ALL CAPS copy (the old image prompt asked for it) reads as shouting in type; set it in sentence case. */
function sentenceCase(t: string): string {
  if (t !== t.toUpperCase() || !/[A-Z]{3}/.test(t)) return t;
  const lower = t.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Figures in cover text that the body never states. Cover text may not add a figure. */
function newFigures(text: string, body: string): string[] {
  const inBody = new Set(numbersIn(body));
  return numbersIn(text).filter((n) => !inBody.has(n));
}

export function scoreHeadline(headline: string, input: Pick<CoverCopyInput, "body" | "icp">): HeadlineScore {
  const n = words(headline).length;
  const problems: string[] = [];
  if (n < 3) problems.push(`only ${n} word(s)`);
  if (n > MAX_WORDS) problems.push(`${n} words, over ${MAX_WORDS}`);
  if (VAGUE.test(headline)) problems.push("names a topic instead of making a claim");
  const figures = newFigures(headline, input.body);
  if (figures.length) problems.push(`states ${figures.join(", ")}, which the draft does not`);
  const icpText = `${input.icp.who} ${input.icp.role} ${input.icp.company_type}`;
  return {
    words: n,
    length: n >= 6 && n <= 10 ? 1 : (n >= 4 && n <= 5) || (n >= 11 && n <= 12) ? 0.5 : 0,
    icp_relevant: icpText.trim() ? sharedWords(headline, icpText) > 0 : false,
    problems,
  };
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

/**
 * The most quotable sentence of the body, word for word: 7-22 words, no
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
      if (n < 7 || n > 22 || /\d/.test(text) || /[?*_`#[\]]/.test(text) || LEANS_ON_CONTEXT.test(text)) continue;
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
  const proposed = sentenceCase(clean(input.card.headline));
  const proposedScore = proposed ? scoreHeadline(proposed, input) : undefined;
  let headline = proposed;
  let score = proposedScore;
  let source: CoverCopy["headline_source"] = "strategist";
  if (!proposed || proposedScore!.problems.length) {
    if (proposed) notes.push(`Strategist headline not used: ${proposedScore!.problems.join("; ")}.`);
    headline = sentenceCase(clean(input.title));
    score = scoreHeadline(headline, input);
    source = "title";
  }

  let kicker = clean(input.card.subtitle);
  if (kicker && (kicker.length > 120 || newFigures(kicker, input.body).length || VAGUE.test(kicker))) {
    notes.push("Strategist subtitle not used: too long, vague, or states a figure the draft does not.");
    kicker = "";
  }

  const numbered = input.layout ? undefined : pickNumber(input.card, input.body, input.claimsOk, notes);
  const quote = input.layout ? undefined : pickQuote(input.body);
  // Most preferred first: a verified figure stops the scroll best, and
  // STATEMENT (dark) leads HEADLINE when the post has neither (user decision, 2026-10-01).
  const available: CoverLayout[] = [...(numbered ? (["NUMBER"] as const) : []), ...(quote ? (["QUOTE"] as const) : []), "STATEMENT", "HEADLINE"];
  const layout = input.layout ?? pickLayout(available, input.recentLayouts);

  const base = { layout, label: audienceLabel(input.icp), headline_source: source, score: score!, notes };
  if (layout === "NUMBER" && numbered) {
    return { ...base, headline: numbered.caption, emphasis: pickEmphasis(numbered.caption, undefined), number: numbered.number };
  }
  if (layout === "QUOTE" && quote) return { ...base, headline, quote };
  return { ...base, headline, emphasis: pickEmphasis(headline, input.card.emphasis_word), kicker: kicker || undefined };
}
