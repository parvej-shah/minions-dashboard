/**
 * The patterns that make a post read as machine-written, found in code.
 *
 * Tenant zero's LinkedIn, Sep 2026: the posts Minions wrote leaned on the same
 * few figures ("It isn't X. It's Y.", "No alert. No follow-up. No trace.", a
 * one-line maxim to close) and drew about half the reach of the profile's
 * other posts. The limits below follow published measurements of model text,
 * not any one author's posts: Pangram's corpus study
 * (pangram.com/signs-of-ai-writing: groups of three 4x, "not X but Y" 3x,
 * arrows and symbols 3x more common than in people's writing) and Wikipedia's
 * "Signs of AI writing". Telling the writer not to use them was not enough.
 *
 * Jev (src/lib/ai/jev.ts) decides whether a finished draft needs its one
 * rewrite; this module finds the exact sentences to fix, and decides on its
 * own when Jev is unavailable (src/services/draftPolish.ts).
 */

import { sentences } from "./banned";

export interface SlopProblem {
  /** Stable id, for tests and logs. */
  kind: "contrast" | "fragments" | "anaphora" | "triads" | "rhythm" | "vocabulary" | "symbols" | "maxim_close"
    // Only Jev can see these two (src/services/draftPolish.ts); the code never reports them.
    | "lecture" | "generic";
  /** What the rewrite must fix, in words the model can act on. */
  fix: string;
  /** The offending text, quoted to the rewrite so it knows where to look. */
  examples: string[];
}

export interface SlopReport {
  problems: SlopProblem[];
  /** Weighted count; lower is better. A rewrite is kept only when it lowers this. */
  score: number;
}

/** "It's not X, it's Y" is fine once in a post; more than that is the tell. */
const CONTRAST_ALLOWED = 1;
/** Below this many words a text (a hook, an X post) may not use the contrast figure at all. */
const SHORT_TEXT_WORDS = 120;
/** Three "X, Y and Z" lists in one short post read as a formula. */
const TRIADS_ALLOWED = 3;
/** Below this many sentences there is too little text to judge rhythm. */
const RHYTHM_MIN_SENTENCES = 8;
/** Spread of sentence lengths (standard deviation over mean) below which the beat is even. */
const RHYTHM_MIN_SPREAD = 0.35;

/** Words and stock phrases that are many times more common in model text than in people's. */
const AI_VOCABULARY = [
  "crucial", "pivotal", "underscore", "underscores", "foster", "fosters", "showcase", "showcases",
  "serves as", "stands as", "tapestry", "delve", "landscape", "realm", "robust", "seamless", "seamlessly",
  "leverage", "leveraging", "navigate the", "elevate", "unlock", "game-changer", "game changer",
  "in today's", "it's worth noting", "let that sink in", "here's the thing", "the truth is",
  "the reality is", "make no mistake", "at the end of the day", "the bottom line",
  "speaks volumes", "a testament to", "in the world of", "ever-evolving", "fast-paced",
];

const SYMBOLS = /[→←⇒≈✅✔️☑️❌🚀🔥💡👇📈⏺️]/u;

const NEGATION = /(?:n't|n’t|\bnot\b)/i;
const AFFIRMATION_START = /^(?:it|this|that|they|he|she|what|the answer)(?:'s|’s| is| are| was| signals| means| becomes)\b/i;

const wordsOf = (s: string) => s.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
const bodyLines = (text: string) => text.split("\n").filter((l) => !/^\s*#{1,6}\s/.test(l)).join("\n");

/** Each "not X ... it's Y" figure, inside one sentence or across two. */
function contrasts(ss: string[]): string[] {
  const out: string[] = [];
  ss.forEach((s, i) => {
    // "doesn't signal X, it signals Y" / "not X, but Y" / "X, not Y."
    if (/(?:n't|n’t|\bnot)\b[^.!?]{1,80}?[,;:]\s*(?:but\s+)?(?:it|this|that|they)(?:'s|’s| is| are)?\s+\w+/i.test(s)) {
      out.push(s);
      return;
    }
    if (/\bnot (?:just|only|because)\b[^.!?]{1,80}\bbut\b/i.test(s) || /,\s*not\s+[^,.!?]{1,60}[.!?]$/i.test(s)) {
      out.push(s);
      return;
    }
    // "Speed-to-lead isn't a courtesy. It's the signal."
    const next = ss[i + 1];
    if (next && NEGATION.test(s) && wordsOf(s).length <= 16 && AFFIRMATION_START.test(next.trim())) out.push(`${s} ${next}`);
    // "Not when the agent says so. Not when ... Only when ..." / "Not because of the words. Because ..."
    if (/^not\b/i.test(s) && next && /^(?:only|just|because)\b/i.test(next.trim())) out.push(`${s} ${next}`);
    // "The problem is not the content. The reader hears the machinery."
    else if (next && /^the (?:real )?(?:problem|issue|point|answer|fix|question|difference|reason|cause|bottleneck) (?:is not|isn't|isn’t|was not|wasn't|wasn’t)\b/i.test(s) && wordsOf(s).length <= 12) out.push(`${s} ${next}`);
  });
  return out;
}

/** Runs of three or more very short sentences: "No alert. No follow-up. No trace." */
function fragmentRuns(ss: string[]): string[] {
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 3) out.push(run.join(" "));
    run = [];
  };
  for (const s of ss) {
    // A line that is a figure ("$300", "AED 1,100") is data, not a beat.
    if (wordsOf(s).length <= 4 && !/\d/.test(s)) run.push(s);
    else flush();
  }
  flush();
  return out;
}

/** Consecutive sentences opening on the same word for effect: "No ... No ...", "Not when ... Not when ...". */
function anaphora(ss: string[]): string[] {
  const out: string[] = [];
  for (let i = 1; i < ss.length; i++) {
    const a = ss[i - 1].trim().split(/\s+/)[0]?.toLowerCase();
    const b = ss[i].trim().split(/\s+/)[0]?.toLowerCase();
    if (a && a === b && /^(?:no|not|only|every|never|just|less|more|fewer)$/.test(a)) out.push(`${ss[i - 1]} ${ss[i]}`);
  }
  return Array.from(new Set(out));
}

/** "A, B, and C" lists of three short items. */
function triads(text: string): string[] {
  return text.match(/\b[\w'’-]+(?: [\w'’-]+){0,3}, [\w'’-]+(?: [\w'’-]+){0,3},? (?:and|or) [\w'’-]+(?: [\w'’-]+){0,3}\b/gi) ?? [];
}

/** True when nearly every sentence is the same length: the even beat people notice. */
function evenRhythm(ss: string[]): boolean {
  const lengths = ss.map((s) => wordsOf(s).length).filter((n) => n > 0);
  if (lengths.length < RHYTHM_MIN_SENTENCES) return false;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const sd = Math.sqrt(lengths.reduce((a, n) => a + (n - mean) ** 2, 0) / lengths.length);
  // People mix 4-word sentences with 30-word ones; models cluster at 12-20.
  return sd / mean < RHYTHM_MIN_SPREAD;
}

/** A last paragraph that is one short maxim: "The backend is the truth." */
function maximClose(text: string): string | null {
  const paras = bodyLines(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const last = paras[paras.length - 1];
  if (!last || paras.length < 3) return null;
  const ss = sentences(last).filter((s) => !/^#/.test(s));
  // Hashtag lines are not prose.
  if (ss.length === 0 || /^#\w/.test(last)) return null;
  const only = ss.length === 1 ? ss[0] : null;
  if (!only || only.endsWith("?")) return null;
  if (wordsOf(only).length > 14) return null;
  return only;
}

function vocabulary(text: string): string[] {
  const lower = text.toLowerCase();
  return AI_VOCABULARY.filter((w) => new RegExp(`(?:^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z]|$)`).test(lower));
}

/** Spread of sentence lengths, for tests and calibration. */
export function rhythmSpread(text: string): number {
  const lengths = sentences(bodyLines(text)).map((s) => wordsOf(s).length).filter((n) => n > 0);
  if (!lengths.length) return 0;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  return Math.sqrt(lengths.reduce((a, n) => a + (n - mean) ** 2, 0) / lengths.length) / mean;
}

/** At or above this score a draft gets its one rewrite when Jev cannot be asked: two figures past their allowance. */
export const SLOP_REWRITE_AT = 2;

export function slopReport(text: string): SlopReport {
  const prose = bodyLines(text).replace(/(^|\s)#\w+/g, " ");
  const ss = sentences(prose).filter((s) => !/^(?:[-*]\s|\d+\.\s)/.test(s));
  const problems: SlopProblem[] = [];

  // In a hook or a short post the one allowed contrast is the whole skeleton, so none is allowed there.
  const contrastAllowed = prose.split(/\s+/).filter(Boolean).length < SHORT_TEXT_WORDS ? 0 : CONTRAST_ALLOWED;
  const c = contrasts(ss);
  if (c.length > contrastAllowed) {
    problems.push({
      kind: "contrast",
      fix: `Uses the "it isn't X, it's Y" figure ${c.length} times. ${contrastAllowed ? "Keep at most one; say the other points" : "In a text this short, say each point"} directly, as a plain statement.`,
      examples: c.slice(0, 4),
    });
  }
  const f = fragmentRuns(ss);
  if (f.length) {
    problems.push({
      kind: "fragments",
      fix: "Has runs of three or more tiny sentences for effect. Merge each run into one ordinary sentence.",
      examples: f.slice(0, 3),
    });
  }
  const a = anaphora(ss);
  if (a.length) {
    problems.push({
      kind: "anaphora",
      fix: "Repeats the same opening word in back-to-back sentences for rhythm. Rewrite them as one plain sentence.",
      examples: a.slice(0, 3),
    });
  }
  const t = triads(prose);
  if (t.length > TRIADS_ALLOWED) {
    problems.push({
      kind: "triads",
      fix: `Lists things in threes ${t.length} times. Keep the one list that matters; elsewhere name one or two things.`,
      examples: t.slice(0, 4),
    });
  }
  if (evenRhythm(ss)) {
    problems.push({
      kind: "rhythm",
      fix: "Every sentence is about the same length. Vary it the way people talk: let one or two sentences run long (25 to 35 words) with a reason or an aside, and keep a few very short.",
      examples: [],
    });
  }
  const v = vocabulary(prose);
  if (v.length) {
    problems.push({
      kind: "vocabulary",
      fix: `Uses stock AI phrasing (${v.join(", ")}). Replace each with the plain word a person would say.`,
      examples: v,
    });
  }
  const sym = prose.match(new RegExp(SYMBOLS.source, "gu")) ?? [];
  if (sym.length) {
    problems.push({
      kind: "symbols",
      fix: `Uses arrows or decorative symbols (${Array.from(new Set(sym)).join(" ")}). Use words instead.`,
      examples: Array.from(new Set(sym)),
    });
  }
  const m = maximClose(text);
  if (m) {
    problems.push({
      kind: "maxim_close",
      fix: "Ends on a one-line maxim. End on something specific instead: what the author would check first, an open question they have, or the next thing they will try.",
      examples: [m],
    });
  }

  // What each problem costs, per occurrence over what is allowed.
  const weight: Record<SlopProblem["kind"], number> = { contrast: 2, fragments: 2, anaphora: 1, triads: 1, rhythm: 2, vocabulary: 1, symbols: 1, maxim_close: 1, lecture: 0, generic: 0 };
  const allowed: Partial<Record<SlopProblem["kind"], number>> = { contrast: contrastAllowed, triads: TRIADS_ALLOWED };
  const score = problems.reduce((n, p) => n + weight[p.kind] * Math.max(1, (p.examples.length || 1) - (allowed[p.kind] ?? 0)), 0);
  return { problems, score };
}
