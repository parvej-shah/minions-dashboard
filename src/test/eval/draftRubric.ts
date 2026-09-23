/**
 * The draft rubric (phase 4). As with ideas (rubric.ts), the judge answers
 * yes/no questions with quotes, and what counts is decided in scoreDraft,
 * where the quotes are checked against the draft and the author's memory.
 */
import type { EvalTenant } from "./corpus";
import { JUDGE_MODEL } from "./rubric";
import { contentWords, norm, unsupportedNumbers } from "@/lib/harvest/text";
import { measure, type Readability } from "@/lib/drafts/readability";

type Json = Record<string, unknown>;

export interface DraftVerdict {
  author_advantage: boolean;
  refs: string[];
  memory_quote: string;
  /** Exact words in the DRAFT that carry the author's detail. */
  draft_quote: string;
  first_person_fabrication: boolean;
  fabrication_quote: string;
  invented_facts: boolean;
  invented_facts_quote: string;
  generic: boolean;
  one_argument: boolean;
  on_icp_problem: boolean;
  note: string;
}

export interface Draft {
  idea: Json;
  title: string;
  hook: string;
  body: string;
  claims_ok: string;
  /** Anything the pipeline's own checks reported (phase 4 on). */
  check?: Json;
}

export interface DraftScore {
  tenant: string;
  draft: Draft;
  verdict: DraftVerdict;
  readability: Readability;
  author_advantage: boolean;
  unsupported_numbers: string[];
  invented: boolean;
  /** Author advantage carried into the draft, nothing fabricated or invented, not generic. */
  draft_pass: boolean;
}

export const MIN_SHARED_WORDS = 3;

export function scoreDraft(draft: Draft, verdict: DraftVerdict, tenant: EvalTenant): DraftScore {
  const text = `${draft.hook}\n${draft.body}`;
  const quote = norm(verdict.draft_quote ?? "");
  const quoteWords = contentWords(quote);
  const sources: Record<string, string> = Object.fromEntries([
    ...tenant.memory.map((m, i) => [`M${i + 1}`, m.content] as const),
    ["PROOF", tenant.settings.tone_guidelines.allowed_proof_claims.join(" ")] as const,
  ]);
  const grounded = (verdict.refs ?? []).some((ref) => sources[ref] && [...contentWords(sources[ref])].filter((w) => quoteWords.has(w)).length >= MIN_SHARED_WORDS);
  const authorAdvantage = verdict.author_advantage && quote.length >= 8 && norm(text).includes(quote) && grounded;

  const idea = draft.idea;
  const signals = (idea.signals as { title?: string; snippet?: string }[] | undefined) ?? [];
  const unsupported = unsupportedNumbers(text, [
    ...tenant.memory.map((m) => m.content),
    ...tenant.settings.tone_guidelines.allowed_proof_claims,
    ...tenant.signals.map((s) => `${s.title} ${s.contentSnippet}`),
    ...signals.map((s) => `${s.title ?? ""} ${s.snippet ?? ""}`),
    tenant.settings.positioning,
    tenant.icp,
    ...(tenant.settings.directives ?? []).map((d) => d.content),
    ...["raw_idea", "angle", "why", "icp_problem", "author_advantage"].map((k) => String(idea[k] ?? "")),
  ]);
  const invented = verdict.invented_facts || unsupported.length > 0;
  return {
    tenant: tenant.id,
    draft,
    verdict,
    readability: measure(draft.hook, draft.body),
    author_advantage: authorAdvantage,
    unsupported_numbers: unsupported,
    invented,
    draft_pass: authorAdvantage && !verdict.first_person_fabrication && !invented && !verdict.generic,
  };
}

const RUBRIC = `Answer these questions about EACH draft. Be strict; when unsure, answer the less flattering way.

author_advantage: Does the draft use something THIS author has specifically lived, built, observed or proven (AUTHOR MEMORY or VERIFIED PROOF), with a specific detail from it (the event, the finding, the mechanism, the number), not just the same topic? List the ids in refs (e.g. ["M3"] or ["PROOF"]). memory_quote = the words in the memory item; draft_quote = the words IN THE DRAFT that carry that detail, copied exactly from the draft, never from the memory. If the draft has no such words, answer false.

first_person_fabrication: Does the draft claim first-person experience, work, clients or results ("we built", "I saw", "one of our clients") that is NOT in AUTHOR MEMORY or VERIFIED PROOF? true = fabricated (bad). Quote it in fabrication_quote.

invented_facts: Does the draft state a number, result, study, customer story or fact that appears in NONE of: author memory, verified proof, market signals? A hedged or "for example" number still counts if it is presented with fake precision. true = invented (bad). Quote it.

generic: Could a competitor in the same field publish this draft unchanged? true = generic (bad).

one_argument: Does the whole draft build ONE central argument, every section serving it, rather than a list of loosely related points? true = one argument (good).

on_icp_problem: Does the draft stay on a specific problem or decision of the ICP? true = good.

note: one short sentence on the biggest weakness.`;

export function renderDraftJudge(tenant: EvalTenant, drafts: Draft[]) {
  const memory = tenant.memory.map((m, i) => `M${i + 1} [${m.kind}] ${m.content}`).join("\n");
  const proof = tenant.settings.tone_guidelines.allowed_proof_claims.map((p) => `- ${p}`).join("\n");
  const signals = tenant.signals.map((s) => `- ${s.title}: ${s.contentSnippet}`).join("\n");
  const list = drafts.map((d, i) => `DRAFT ${i + 1}\nTITLE: ${d.title}\nHOOK: ${d.hook}\nBODY:\n${d.body}`).join("\n\n=====\n\n");
  return {
    model: JUDGE_MODEL,
    enable_thinking: false,
    temperature: 0,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You audit drafts for a thought-leadership product. You judge whether each draft could only have come from this specific author, for this specific audience, and whether it invents anything.

AUTHOR: ${tenant.summary}
ICP: ${tenant.icp}

AUTHOR MEMORY (what the author has actually lived):
${memory}

VERIFIED PROOF:
${proof || "- none"}

MARKET SIGNALS the pipeline saw:
${signals}

${RUBRIC}

Return ONLY JSON, no fences:
{"verdicts": [{"author_advantage": bool, "refs": [], "memory_quote": "", "draft_quote": "", "first_person_fabrication": bool, "fabrication_quote": "", "invented_facts": bool, "invented_facts_quote": "", "generic": bool, "one_argument": bool, "on_icp_problem": bool, "note": ""}]}
One verdict per draft, in order.`,
      },
      { role: "user", content: list },
    ],
  };
}
