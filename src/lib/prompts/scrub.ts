import type { ChatPayload } from "./types";

/**
 * Rewrites the few sentences of a finished draft that use a word the brand
 * never uses (src/services/bannedScrub.ts). Called by the dashboard itself,
 * not by an n8n "Qwen" node, so it is not one of PROMPT_STAGES.
 */
export interface ScrubInput {
  banned: string[];
  sentences: string[];
}

export function renderScrub(input: ScrubInput): ChatPayload {
  const system = `You fix single sentences so they avoid words a brand never uses.

Words and phrases the brand never uses, in any capitalisation: ${input.banned.map((b) => `"${b}"`).join(", ")}.

For each sentence:
- Replace only the banned word or phrase with plain words that mean the same here. Change nothing else you do not have to.
- Keep every fact, number, name and claim exactly. Add nothing new.
- Keep the sentence's length, tone and any leading markdown ("## ", "- ") as they are.
- No em dashes.

Return ONLY this JSON, one entry per sentence, with the same ids:
{"rewrites":[{"id":1,"text":"the rewritten sentence"}]}`;

  const user = input.sentences.map((s, i) => `${i + 1}. ${s}`).join("\n");

  return {
    model: "qwen3.7-flash",
    enable_thinking: false,
    temperature: 0.2,
    max_tokens: 2000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
}
