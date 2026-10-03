import type { ChatPayload } from "./types";
import type { SlopProblem } from "@/lib/drafts/slop";

/**
 * The one rewrite a finished draft gets when it still reads as
 * machine-written (src/services/draftPolish.ts). Called by the dashboard
 * itself, not by an n8n "Qwen" node, so it is not one of PROMPT_STAGES.
 */
export interface HumanizeInput {
  text: string;
  /** "post" for a LinkedIn/Facebook post, "article" for the blog body (keeps its ## headings), "hook" for the opening line, "x" for the X post. */
  kind: PolishKind;
  problems: Pick<SlopProblem, "fix" | "examples">[];
}

export type PolishKind = "post" | "article" | "hook" | "x";

const KIND_LABEL: Record<PolishKind, string> = {
  post: "LinkedIn post",
  article: "article",
  hook: "post's opening line (one or two sentences)",
  x: "post for X",
};

export function renderHumanize(input: HumanizeInput): ChatPayload {
  const problems = input.problems
    .map((p, i) => `${i + 1}. ${p.fix}${p.examples.length ? `\n   Where: ${p.examples.map((e) => `"${e}"`).join(" | ")}` : ""}`)
    .join("\n");

  const system = `You revise a finished ${KIND_LABEL[input.kind]} so it reads like its author wrote it, not like a language model following a template. Fix the problems listed and nothing else.

Rules:
- Keep every fact, number, name, claim, link and hashtag exactly. Add no new fact, number, example, client, result or experience.
- Keep the point of view. If the text speaks in the first person, keep it. If it does not, you may frame an opinion as the author's ('I think', 'I'd check'), but never claim the author did, saw, built or tested anything.
- Keep the argument, the order of the points and the opening line's meaning. Keep the length within 15% of the original.
- Keep ${input.kind === "article" ? "every '## ' heading line exactly, and the" : "the"} paragraph breaks style (blank line between paragraphs).
- While fixing, do not introduce any of these: "it isn't X, it's Y" figures, runs of tiny sentences, sentences opening on the same word back to back, a one-line maxim at the end, em dashes, arrows or symbols.
- Vary sentence length the way people talk: some short, a couple long with a reason or an aside.

Return ONLY this JSON: {"text": "the full revised ${input.kind}"}`;

  return {
    model: "glm-5.2",
    enable_thinking: false,
    temperature: 0.6,
    max_tokens: 3000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Problems to fix:\n${problems}\n\nText:\n${input.text}` },
    ],
  };
}
