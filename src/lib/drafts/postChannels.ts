import { POST_CHANNELS, type PostChannel } from "@/constants/postChannels";

/**
 * Flip one channel for a single post (D18). The result is the post's new
 * override in workspace order, or null when every offered channel is on again
 * (the post follows the workspace). Turning off the last one is refused.
 */
export function toggleChannel(
  offered: PostChannel[],
  on: PostChannel[],
  c: PostChannel
): { channels: PostChannel[] | null } | { refused: true } {
  const next = on.includes(c) ? on.filter((x) => x !== c) : [...on, c];
  if (next.length === 0) return { refused: true };
  if (offered.every((x) => next.includes(x))) return { channels: null };
  return { channels: POST_CHANNELS.filter((x) => next.includes(x)) };
}
