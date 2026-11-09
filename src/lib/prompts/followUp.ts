import type { ChatPayload } from "./types";
import { SOUND_HUMAN } from "./soundHuman";
import { CAPTION_WORDS } from "@/lib/carousel/plan";

/**
 * The text of a second LinkedIn post (src/services/followUp.ts): the same draft
 * goes out again days later in the format it did not use, its carousel or its
 * cover. The first post's text is shown so the second does not open the same
 * way or repeat its sentences. Called by the dashboard, not by n8n.
 */
export interface FollowUpPostInput {
  /** What LinkedIn already showed with the first post. */
  posted: string;
  /** The draft's article body: the only source of what the post may say. */
  body: string;
  /** CAROUSEL: the text above a swipeable document. COVER: a post beside one image. */
  format: "CAROUSEL" | "COVER";
  /** Words the workspace never uses. */
  banned: string[];
}

export const FOLLOW_UP_WORDS = { CAROUSEL: { min: CAPTION_WORDS.min + 5, max: CAPTION_WORDS.max - 15, hashtags: 2 }, COVER: { min: 80, max: 200, hashtags: 3 } } as const;

export function renderFollowUpPost(input: FollowUpPostInput): ChatPayload {
  const limits = FOLLOW_UP_WORDS[input.format];
  const shape =
    input.format === "CAROUSEL"
      ? `It sits above a swipeable carousel of the same argument. Open with one line that makes the reader want to swipe, then one or two short lines pointing into the carousel.`
      : `It sits beside one cover image. Open with a single standalone hook line, then 2 to 4 short paragraphs building the argument, then a useful observation or a natural discussion question.`;

  const system = `You write a second LinkedIn post for an author. A few days ago they posted the FIRST POST below. This new post shares the same argument again in another format, for people who missed it and for those who saw it.

${shape}

Rules:
- ${limits.min} to ${limits.max} words${input.format === "COVER" ? ", not counting hashtags" : ", hashtags included"}. Short paragraphs separated by a blank line.
- Open with a different first line from the first post, and do not repeat any of its sentences. A new angle on the same point: a different example from the article, a sharper consequence, or the question it answers.
- Say only what the ARTICLE says. No new figure, cause, result, customer or claim. Keep its names and the exact sense of any figure.
- Never say "as I posted", "repost", "in case you missed it" or refer to the first post.
- End with one final line of up to ${limits.hashtags} hashtags naming the post's specific topic, industry or audience, never a generic tag like #AI or #Leadership.
- No links, no em dashes, no raw markdown (*, **, #, \`) except the hashtags, no "comment below", no "follow for more".${input.banned.length ? `\n- Never use these words or phrases: ${input.banned.join(", ")}.` : ""}

Sound like a person, not a model:
${SOUND_HUMAN}

Return ONLY this JSON: {"post": "the full post text"}`;

  return {
    model: "qwen3.8-max-0902",
    enable_thinking: false,
    temperature: 0.7,
    max_tokens: 900,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `FIRST POST:\n${input.posted.slice(0, 3000)}\n\nARTICLE:\n${input.body.slice(0, 8000)}` },
    ],
  };
}
