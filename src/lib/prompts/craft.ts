import { CRAFT_EXTRACT_INSTRUCTION } from "@/lib/ai/craftExtract";
import type { ChatPayload } from "./types";

/** 01_idea_harvester › Build Craft Payload */
export interface CraftInput {
  /** Articles fetched by /api/ideas/craft, in the order their notes come back. */
  articles: { title: string; url: string; text: string }[];
}

/**
 * Studies HOW each source article is built, never its wording. The
 * no-verbatim rule is also enforced in code after the call (verbatimGuard).
 */
export function renderCraft(input: CraftInput): ChatPayload {
  const articles = input.articles || [];
  const userMessage = articles.map((a, i) => `[${i + 1}] ${a.title}\nURL: ${a.url}\n---\n${a.text}`).join("\n\n=====\n\n");

  return {
    model: "qwen3.8-max",
    enable_thinking: false,
    temperature: 0.4,
    max_tokens: 1200,
    messages: [
      {
        role: "system",
        content:
          CRAFT_EXTRACT_INSTRUCTION +
          '\n\nYou will receive several numbered articles. Return {"notes":[{"index":1,"craft_notes":"..."}]} with one entry per article.',
      },
      { role: "user", content: userMessage },
    ],
  };
}
