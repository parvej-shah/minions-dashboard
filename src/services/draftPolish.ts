import { chatWithFallback } from "@/lib/ai/modelChain";
import { askJev, type JevQuestion } from "@/lib/ai/jev";
import { slopReport, SLOP_REWRITE_AT, type SlopProblem } from "@/lib/drafts/slop";
import { rejectPolish } from "@/lib/drafts/polish";
import { renderHumanize, type PolishKind } from "@/lib/prompts/humanize";
import { firstParagraph, lastParagraph, lineRepeats } from "@/lib/drafts/openingRepeats";

/**
 * Makes a finished draft read like its author wrote it (see src/lib/drafts/slop.ts).
 *
 * Jev judges each text; when it reads as template writing, Qwen rewrites it
 * once, aimed at the exact sentences the code found, and the rewrite is kept
 * only if it changes nothing but the wording and Jev (or, without Jev, the
 * code) rates it better. One rewrite, not more: a second pass drifts from the
 * author's argument and costs another 10 to 20 seconds inside 02's two-minute
 * call. A text that still fails keeps whichever version scored better.
 */

/** How many rewrites a text may get. */
export const MAX_REWRITES = 1;
/** On Jev's 0-4 "reads as a person" scale, below this a text is rewritten. */
const HUMAN_SCORE_MIN = 2.5;
/** Below this Jev score the rewrite recasts the voice, not just the figures. */
const RECAST_BELOW = 1.5;
const RECAST_FIX =
  "Reads as a brand lecturing the reader. Recast it as the author talking to a peer: put their view in the first person ('I think', 'what I'd check first', 'I'm not sure yet'), talk about the situation instead of telling the reader what they must do, and close on what the author would check or still wonders. Keep every fact; claim no experience.";
/** A Jev yes above this counts. */
const YES = 0.7;
/** The rewrite must finish well inside 02's 120 s Scrub Banned Words call. */
const REWRITE_BUDGET_MS = 75_000;

/** The texts of a draft that are prose worth polishing, and how each is shaped. */
const POLISHED: Record<string, PolishKind> = { body: "article", hook: "hook", li_variant: "post", fb_variant: "post", x_variant: "x" };

const QUESTIONS: Record<string, JevQuestion> = {
  human: {
    type: "score",
    instructions: "How much does this read like one specific person wrote it, rather than a language model following a template?",
    criteria: [
      "Template AI writing: formula contrasts, dramatic fragments, even rhythm, slogan ending",
      "Mostly template, with a few personal touches",
      "Mixed",
      "Mostly a person with their own point of view",
      "Clearly one person talking: concrete, uneven, their own voice",
    ],
  },
  contrast: { type: "noul", instructions: "Does it use the \"it isn't X, it's Y\" or \"not X, but Y\" construction more than once?" },
  fragments: { type: "noul", instructions: "Does it use runs of very short sentence fragments for dramatic effect, like \"No alert. No follow-up. No trace.\"?" },
  maxim_close: { type: "noul", instructions: "Does it end on a short, slogan-like maxim?" },
  lecture: { type: "noul", instructions: "Does it lecture or accuse the reader (\"Your X is failing\", \"You are doing Y wrong\") instead of talking to them as a peer?" },
  generic: { type: "noul", instructions: "Could almost anyone in this field have written it, with no specific moment, detail or opinion that belongs to one author?" },
};

/** Fixes for what only Jev can see; the code finds the rest with examples. */
const JEV_ONLY_FIX: Record<string, string> = {
  lecture: "Lectures or accuses the reader. Talk about the situation as a peer would, and put the author's view in the first person.",
  generic: "Reads as if anyone could have written it. Make the author's own view explicit: what they think, what they would check first, what they are unsure about. Add no facts.",
};

export interface PolishVerdict {
  /** Jev's 0-4 "reads as a person" score, or null when Jev was not asked. */
  human: number | null;
  /** The code's weighted count of AI figures. */
  slop: number;
  problems: (Pick<SlopProblem, "fix" | "examples"> & { kind: SlopProblem["kind"] | "lecture" | "generic" | "repeat" })[];
  needsRewrite: boolean;
}

/** The workspace's recent first and last lines (task 113 phase 3). */
export interface RecentLines {
  openings: string[];
  closings: string[];
}

/**
 * A line that repeats a recent post. `force` makes it a reason to rewrite on
 * its own (the hook: a short, cheap call); otherwise it only rides along in a
 * rewrite the text already gets, so a repeated close never costs a call.
 */
interface RepeatCheck {
  fix: string;
  force: boolean;
  repeats: (text: string) => boolean;
}

export async function judge(text: string): Promise<PolishVerdict> {
  const code = slopReport(text);
  const jev = await askJev(text, QUESTIONS);
  const problems: PolishVerdict["problems"] = [...code.problems];
  if (!jev) return { human: null, slop: code.score, problems, needsRewrite: code.score >= SLOP_REWRITE_AT };

  const yes = (k: string) => (jev[k]?.noul ?? 0) >= YES;
  for (const k of Object.keys(JEV_ONLY_FIX)) if (yes(k)) problems.push({ kind: k as "lecture" | "generic", fix: JEV_ONLY_FIX[k], examples: [] });
  // Jev saw a figure the code's patterns missed: ask for it without examples.
  for (const k of ["contrast", "fragments", "maxim_close"] as const) {
    if (yes(k) && !problems.some((p) => p.kind === k)) problems.push({ kind: k, fix: QUESTIONS[k].instructions.replace(/^Does it /, "It does: ").replace(/\?$/, ". Rewrite those as plain sentences."), examples: [] });
  }
  const human = typeof jev.human?.score === "number" ? jev.human.score : null;
  // Far below a person: removing figures alone leaves a lecture, so the voice changes too.
  if (human !== null && human < RECAST_BELOW && !problems.some((p) => p.kind === "generic")) {
    problems.push({ kind: "generic", fix: RECAST_FIX, examples: [] });
  }
  const needsRewrite = (human !== null && human < HUMAN_SCORE_MIN) || ["contrast", "fragments", "maxim_close", "lecture", "generic"].some(yes);
  return { human, slop: code.score, problems, needsRewrite: needsRewrite || code.score >= SLOP_REWRITE_AT + 2 };
}

/** True when `after` reads better than `before`: Jev's score when both have one, else the code's count. */
const better = (after: PolishVerdict, before: PolishVerdict) =>
  after.human !== null && before.human !== null ? after.human > before.human && after.slop <= before.slop : after.slop < before.slop;

function parseText(raw: string): string | null {
  try {
    const content = JSON.parse(raw)?.choices?.[0]?.message?.content ?? "";
    const json = JSON.parse(String(content).replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
    // Models add em dashes whatever they are told; a comma reads the same.
    return typeof json?.text === "string" ? json.text.replace(/\s*(?:—|--)\s*/g, ", ") : null;
  } catch {
    return null;
  }
}

async function rewrite(text: string, kind: PolishKind, problems: PolishVerdict["problems"]): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;
  const payload = renderHumanize({ text, kind, problems });
  const call = chatWithFallback(payload as unknown as Record<string, unknown>, apiKey).then((res) => (res.status < 300 ? parseText(res.body) : null));
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), REWRITE_BUDGET_MS));
  return Promise.race([call, timeout]).catch(() => null);
}

export interface PolishResult {
  text: string;
  before: PolishVerdict;
  after: PolishVerdict;
  rewrites: number;
  /** Why the last rewrite was not kept, when it was not. */
  rejected: string | null;
}

export async function polishText(text: string, kind: PolishKind, repeat?: RepeatCheck): Promise<PolishResult> {
  const before = await judge(text);
  if (repeat) {
    before.problems.push({ kind: "repeat", fix: repeat.fix, examples: [] });
    if (repeat.force) before.needsRewrite = true;
  }
  let best = { text, verdict: before };
  let rewrites = 0;
  let rejected: string | null = null;
  while (best.verdict.needsRewrite && rewrites < MAX_REWRITES) {
    rewrites++;
    const candidate = await rewrite(best.text, kind, best.verdict.problems);
    if (!candidate) {
      rejected = "no rewrite came back";
      break;
    }
    const reason = rejectPolish(best.text, candidate);
    if (reason) {
      rejected = reason;
      continue;
    }
    if (repeat?.force && repeat.repeats(candidate)) {
      rejected = "still repeats a recent post";
      continue;
    }
    const verdict = await judge(candidate);
    // A hook rewritten only for repeating is kept when it reads no worse.
    const fixesRepeat = repeat?.force && !verdict.needsRewrite && verdict.slop <= best.verdict.slop;
    if (better(verdict, best.verdict) || fixesRepeat) best = { text: candidate.trim(), verdict };
    else rejected = "did not read better";
  }
  return { text: best.text, before, after: best.verdict, rewrites, rejected: best.text === text ? rejected : null };
}

/** The cross-post checks for one draft: its opening (hook) and the LinkedIn post's close. */
function repeatChecks(texts: Record<string, string>, recent?: RecentLines): Record<string, RepeatCheck> {
  const checks: Record<string, RepeatCheck> = {};
  if (!recent) return checks;
  const opening = texts.hook?.trim() ? lineRepeats(texts.hook, recent.openings) : null;
  if (opening)
    checks.hook = {
      fix: `Opens the way a recent post did (${opening}). Open with a different first word and a different sentence structure; keep the meaning and every fact.`,
      force: true,
      repeats: (t) => lineRepeats(t, recent.openings) !== null,
    };
  const close = texts.li_variant?.trim() ? lineRepeats(lastParagraph(texts.li_variant), recent.closings) : null;
  if (close)
    checks.li_variant = {
      fix: `Ends the way a recent post did (${close}). End on a different kind of line (a plain observation, a next step or a question), keeping every fact.`,
      force: false,
      repeats: (t) => lineRepeats(lastParagraph(t), recent.closings) !== null,
    };
  return checks;
}

/**
 * Polishes the prose texts of one draft in parallel; other keys pass through.
 * With the workspace's recent lines, a repeated opening is rewritten too.
 */
export async function polishDraft(
  texts: Record<string, string>,
  recent?: RecentLines
): Promise<{ texts: Record<string, string>; report: Record<string, Omit<PolishResult, "text">> }> {
  const out = { ...texts };
  const report: Record<string, Omit<PolishResult, "text">> = {};
  const checks = repeatChecks(texts, recent);
  await Promise.all(
    Object.entries(POLISHED).map(async ([key, kind]) => {
      if (!texts[key]?.trim()) return;
      const { text, ...rest } = await polishText(texts[key], kind, checks[key]);
      out[key] = text;
      report[key] = rest;
    })
  );
  // LinkedIn opens on the hook, so a new hook replaces its repeated first line in code, not by another call.
  if (recent && out.hook !== texts.hook && out.li_variant?.trim()) {
    const first = firstParagraph(out.li_variant);
    const hook = out.hook.trim();
    if (lineRepeats(first, recent.openings)) out.li_variant = out.li_variant.replace(first, () => hook);
  }
  return { texts: out, report };
}
