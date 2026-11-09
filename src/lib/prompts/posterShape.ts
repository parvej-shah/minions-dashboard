import type { ChatPayload } from "./types";
import { ICON_MEANING } from "@/lib/covers/icons";

/**
 * What a post holds that a poster can show (src/lib/covers/shape.ts): a list
 * of points, a grid of parallel things, short punch lines, and whether it is
 * the author's own account. Most posts are prose, so the structure has to be
 * read out of them; code then checks every item against the post and picks
 * the poster type (src/lib/covers/posterType.ts). Called by the dashboard
 * once per draft, not by an n8n "Qwen" node.
 */
export interface PosterShapeInput {
  title: string;
  /** The LinkedIn post the cover is seen beside, else the article body. */
  post: string;
}

const ICON_LIST = Object.entries(ICON_MEANING)
  .map(([name, meaning]) => `${name}: ${meaning}`)
  .join("\n");

export function renderPosterShape(input: PosterShapeInput): ChatPayload {
  const system = `You design the cover image for a LinkedIn post. Read the post and pull out what a poster could show. Only use what the post really says: never add a point, a figure or a claim. Leave a part null when the post doesn't have it; most posts have only one or two.

Return ONLY this JSON:
{
  "list": null or {"title": "...", "items": ["...", "...", "..."]},
  "grid": null or {"title": "...", "items": [{"label": "...", "icon": "..."}, ...]},
  "punch": null or {"lines": ["...", "...", "..."], "checks": ["...", "...", "..."]},
  "own_story": true or false
}

list: the post names 3 or 4 separate problems, reasons, mistakes or steps. title is 3 to 7 words naming what they are. Each item is 2 to 6 words, a plain phrase in sentence case, no full stop.
grid: the post names 3 to 6 parallel things a reader could picture as icons: tools, products, channels, parts of a system, what gets delivered, what gets checked or measured. Each label is 1 to 3 words. icon is the name from the list below that best shows it, written exactly as given. title is 3 to 7 words.
punch: the post makes 3 or 4 short contrasting claims that land hard one after another. Each line is 1 to 5 words, at most 30 characters, and ends with a full stop. checks are 3 or 4 things the reader gets or should do, 2 to 5 words each, no full stop.
own_story: true only when the post is the author telling what they themselves did, saw or learned (first person, "I" or "we"), not general advice.

No colons, no em dashes, no hashtags, no emoji. Every figure you write must appear in the post.

Icons:
${ICON_LIST}`;

  return {
    model: "qwen3.8-max-0902",
    enable_thinking: false,
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Title: ${input.title}\n\nPost:\n${input.post.slice(0, 4000)}` },
    ],
  };
}
