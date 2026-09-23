/**
 * The fixed judging rubric. The judge answers yes/no questions, each with the
 * evidence it relied on; it never gives a 0-100 score. What counts as
 * passing is decided in scoreIdea below, so it can be tested and changed in
 * one reviewed place.
 *
 * Changing the rubric invalidates stored results: re-run the baseline in the
 * same PR.
 */
import type { EvalTenant } from "./corpus";

type Json = Record<string, unknown>;

/** Deliberately not the harvest model, so the judge is not grading its own style. */
export const JUDGE_MODEL = "qwen3-max";

export interface Verdict {
  icp_problem: boolean;
  icp_problem_quote: string;
  author_advantage: boolean;
  /** Memory ids (M1..) or "PROOF" the idea genuinely rests on. */
  author_advantage_refs: string[];
  /** The exact words IN THE IDEA that carry the author-specific detail. */
  author_advantage_quote: string;
  beyond_source: boolean;
  generic: boolean;
  invented_facts: boolean;
  invented_facts_quote: string;
  off_positioning: boolean;
  note: string;
}

export interface IdeaScore {
  run: number;
  idea: { pillar: string; raw_idea: string; angle: string; why: string; signal: string };
  verdict: Verdict;
  /** author_advantage after code checks that the judge's quote is really in the idea and its refs exist. */
  author_advantage: boolean;
  /** Numbers in the idea that appear nowhere in memory, proof or signals. Checked in code, not by the judge. */
  unsupported_numbers: string[];
  invented: boolean;
  /** The authority gate the plan asks for: a real ICP problem, a real author advantage, nothing generic or invented. */
  authority_pass: boolean;
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();

const STOPWORDS = new Set(
  "a an the and or but if of to in on at by for with from into over under about as is are was were be been being it its this that these those their there they them our we you your he she his her not no than then so such can will would should could may might do does did have has had just only more most very what when where which who why how all any each every other some own same too up out".split(" ")
);

/** Content words (lowercased, no stopwords, length >= 3), crudely stemmed. */
export function contentWords(text: string): Set<string> {
  return new Set(
    norm(text)
      .split(" ")
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
      .map((w) => w.replace(/(ing|ed|es|s)$/, ""))
  );
}

/** Every number in a text, normalised ("47 days" -> "47", "2,5" -> "2.5"). */
export function numbersIn(text: string): string[] {
  return Array.from(new Set((text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."))));
}

/**
 * A number that states a fact rather than counts steps: anything with a %, or
 * any number from 10 up. "3 questions" or "2 steps" is structure, not a claim.
 */
function isFactualNumber(n: string, text: string): boolean {
  return Number(n) >= 10 || new RegExp(`\\b${n.replace(".", "\\.")}\\s*%`).test(text);
}

/** How many content words a quote must share with the memory item it cites. */
export const MIN_SHARED_WORDS = 3;

/**
 * The judge's yes/no answers are advisory; these checks are not. The first
 * baseline showed why: the judge credited 67% of ideas with author advantage
 * although the harvest prompt never saw the author's memory at all -- it
 * counts "same topic" as "uses the experience". So author advantage needs:
 * the judge's quote really in the idea, citing a memory item that exists, AND
 * sharing at least MIN_SHARED_WORDS content words with that item. Invented
 * numbers are found by comparing against every input, not by asking.
 */
export function scoreIdea(idea: Json, verdict: Verdict, run: number, tenant: EvalTenant): IdeaScore {
  const signals = (idea.signals as { title?: string }[] | undefined) ?? [];
  const text = [idea.raw_idea, idea.angle, idea.why].map((v) => String(v ?? "")).join(" ");

  const quote = norm(verdict.author_advantage_quote ?? "");
  const quoteWords = contentWords(quote);
  const sources: Record<string, string> = Object.fromEntries([
    ...tenant.memory.map((m, i) => [`M${i + 1}`, m.content] as const),
    ["PROOF", tenant.settings.tone_guidelines.allowed_proof_claims.join(" ")] as const,
  ]);
  const grounded = (verdict.author_advantage_refs ?? []).some((ref) => {
    const source = sources[ref];
    if (!source) return false;
    const shared = [...contentWords(source)].filter((w) => quoteWords.has(w));
    return shared.length >= MIN_SHARED_WORDS;
  });
  const authorAdvantage = verdict.author_advantage && quote.length >= 8 && norm(text).includes(quote) && grounded;

  const known = new Set(
    numbersIn(
      [
        ...tenant.memory.map((m) => m.content),
        ...tenant.settings.tone_guidelines.allowed_proof_claims,
        ...tenant.signals.map((s) => `${s.title} ${s.contentSnippet}`),
        tenant.settings.positioning,
        ...(tenant.settings.directives ?? []).map((d) => d.content),
      ].join(" ")
    )
  );
  const unsupported = numbersIn(text).filter((n) => isFactualNumber(n, text) && !known.has(n));
  const invented = verdict.invented_facts || unsupported.length > 0;

  return {
    run,
    idea: {
      pillar: String(idea.pillar ?? ""),
      raw_idea: String(idea.raw_idea ?? ""),
      angle: String(idea.angle ?? ""),
      why: String(idea.why ?? ""),
      signal: signals[0]?.title ?? "",
    },
    verdict,
    author_advantage: authorAdvantage,
    unsupported_numbers: unsupported,
    invented,
    authority_pass: verdict.icp_problem && authorAdvantage && !verdict.generic && !invented,
  };
}

const RUBRIC = `Answer these questions about EACH idea. Be strict; when unsure, answer the less flattering way.

icp_problem: Does the idea name a SPECIFIC problem, question, or decision this ICP actually faces (not a broad theme like "AI is changing the industry")? Quote the words that name it in icp_problem_quote, or "" if none.

author_advantage: Does the idea rest on something THIS author has specifically lived, built, observed, or proven, as listed under AUTHOR MEMORY or VERIFIED PROOF? It counts only if the idea actually uses that item, not just the same topic. Sharing a TOPIC with a memory item is NOT enough: the idea must carry a specific detail from it (the event, the finding, the mechanism, the number). List the ids in author_advantage_refs (e.g. ["M3"] or ["PROOF"]) and copy the exact words FROM THE IDEA that carry that detail into author_advantage_quote. If you cannot quote such words, answer false.

beyond_source: If the idea came from a market signal, does it add a point of view or implication the signal itself does not state? If it used no signal, answer true only if it says something non-obvious.

generic: Could a competitor in the same field publish this idea unchanged, without any of this author's experience? true = generic (bad).

invented_facts: Does the idea state a number, result, customer story, or fact that appears in NONE of: author memory, verified proof, or the market signals? true = invented (bad). Quote it in invented_facts_quote.

off_positioning: Is the idea outside what this author does or whom they serve? true = off (bad).

note: one short sentence on the biggest weakness.`;

export function renderJudge(tenant: EvalTenant, ideas: Json[]) {
  const memory = tenant.memory.map((m, i) => `M${i + 1} [${m.kind}] ${m.content}`).join("\n");
  const proof = tenant.settings.tone_guidelines.allowed_proof_claims.map((p) => `- ${p}`).join("\n");
  const signals = tenant.signals.map((s) => `- ${s.title}: ${s.contentSnippet}`).join("\n");
  const list = ideas
    .map(
      (idea, i) =>
        `IDEA ${i + 1}\nraw_idea: ${idea.raw_idea}\nangle: ${idea.angle}\nwhy: ${idea.why}\nsignal used: ${
          ((idea.signals as { title?: string }[] | undefined) ?? [])[0]?.title ?? "none"
        }`
    )
    .join("\n\n");

  return {
    model: JUDGE_MODEL,
    enable_thinking: false,
    temperature: 0,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You audit content ideas for a thought-leadership product. You judge whether each idea could only have come from this specific author, for this specific audience.

AUTHOR: ${tenant.summary}
ICP: ${tenant.icp}

AUTHOR MEMORY (what the author has actually lived; the idea generator may or may not have seen this):
${memory}

VERIFIED PROOF:
${proof || "- none"}

MARKET SIGNALS the generator saw:
${signals}

${RUBRIC}

Return ONLY JSON, no fences:
{"verdicts": [{"icp_problem": bool, "icp_problem_quote": "", "author_advantage": bool, "author_advantage_refs": [], "author_advantage_quote": "", "beyond_source": bool, "generic": bool, "invented_facts": bool, "invented_facts_quote": "", "off_positioning": bool, "note": ""}]}
One verdict per idea, in order.`,
      },
      { role: "user", content: list },
    ],
  };
}
