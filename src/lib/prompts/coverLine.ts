import type { ChatPayload } from "./types";

/**
 * Cover lines for a finished draft (src/services/cover.ts). The thumbnail is
 * read in about a second, so it needs a few large words, not the article
 * title. Written from the post itself, after drafting, so it says what the
 * post says. Called by the dashboard, not by an n8n "Qwen" node.
 */
export interface CoverLineInput {
  title: string;
  /** The LinkedIn post the cover is seen beside, else the article body. */
  post: string;
}

export interface ProposedCoverLine {
  line: string;
  /** A word of `line`; absent when the model gave none or one not in the line. */
  accent?: string;
}

const wordKey = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

/** The model's message content as lines; plain strings (older answers) are read too. */
export function parseCoverLines(content: string): ProposedCoverLine[] {
  let json: unknown;
  try {
    json = JSON.parse(content.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
  } catch {
    return [];
  }
  const lines = (json as { lines?: unknown })?.lines;
  if (!Array.isArray(lines)) return [];
  return lines.flatMap((l): ProposedCoverLine[] => {
    if (typeof l === "string") return [{ line: l }];
    const { line, accent } = (l ?? {}) as { line?: unknown; accent?: unknown };
    if (typeof line !== "string") return [];
    const key = typeof accent === "string" ? wordKey(accent) : "";
    const ok = key && line.split(/\s+/).some((w) => wordKey(w) === key);
    return [ok ? { line, accent: (accent as string).trim() } : { line }];
  });
}

export function renderCoverLine(input: CoverLineInput): ChatPayload {
  const system = `You write the words on a LinkedIn post's cover image. People scroll past it on a phone and read it in about one second, so it has a few large words and one idea.

Write 5 different cover lines for the post below. Each one:
- 3 to 6 words and at most 38 characters. Sentence case: capitalise the first word and names only. No full stop.
- Says what the post is about so someone who sees nothing else understands it: name the specific thing (the tool, process, mistake or result), not a category. Plain words, never a slogan or metaphor.
- Shorter and sharper than the title. A claim, a result or a pointed question, in the author's own voice.
- Uses only facts and figures the post states. No figure the post does not state.
- No colons, no "vs", no "explained", no clickbait ("you won't believe"), no em dashes, no hashtags or emoji.

For each line also give its accent: the one word the line turns on, set in a brighter colour. Usually the specific thing, the result or the contrast word. Never a filler word ("the", "your", "how", "is"). One word, copied exactly from that line.

Return ONLY this JSON: {"lines": [{"line": "...", "accent": "..."}, ...5 in all]}`;

  return {
    model: "qwen3.8-max-0902",
    enable_thinking: false,
    temperature: 0.7,
    max_tokens: 300,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Title: ${input.title}\n\nPost:\n${input.post.slice(0, 4000)}` },
    ],
  };
}
