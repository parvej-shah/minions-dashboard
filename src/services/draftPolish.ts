import { chatWithFallback } from "@/lib/ai/modelChain";
import { askJev, type JevQuestion } from "@/lib/ai/jev";
import { slopReport, SLOP_REWRITE_AT, type SlopProblem } from "@/lib/drafts/slop";
import { rejectPolish } from "@/lib/drafts/polish";
import { renderHumanize, type PolishKind } from "@/lib/prompts/humanize";

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
  problems: Pick<SlopProblem, "kind" | "fix" | "examples">[];
  needsRewrite: boolean;
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

export async function polishText(text: string, kind: PolishKind): Promise<PolishResult> {
  const before = await judge(text);
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
    const verdict = await judge(candidate);
    if (better(verdict, best.verdict)) best = { text: candidate.trim(), verdict };
    else rejected = "did not read better";
  }
  return { text: best.text, before, after: best.verdict, rewrites, rejected: best.text === text ? rejected : null };
}

/** Polishes the prose texts of one draft in parallel; other keys pass through. */
export async function polishDraft(texts: Record<string, string>): Promise<{ texts: Record<string, string>; report: Record<string, Omit<PolishResult, "text">> }> {
  const out = { ...texts };
  const report: Record<string, Omit<PolishResult, "text">> = {};
  await Promise.all(
    Object.entries(POLISHED).map(async ([key, kind]) => {
      if (!texts[key]?.trim()) return;
      const { text, ...rest } = await polishText(texts[key], kind);
      out[key] = text;
      report[key] = rest;
    })
  );
  return { texts: out, report };
}
