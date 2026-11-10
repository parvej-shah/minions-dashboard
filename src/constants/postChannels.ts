import type { DistributionChannelKey } from "@/types/channel";

/**
 * The channels one post can be sent to or kept off (plan decision D18). X has
 * no publisher yet, so it is not offered.
 */
export const POST_CHANNELS = ["blog", "linkedin", "facebook", "instagram"] as const satisfies readonly DistributionChannelKey[];
export type PostChannel = (typeof POST_CHANNELS)[number];

export const POST_CHANNEL_LABEL: Record<PostChannel, string> = { blog: "Blog", linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram" };

/**
 * Whether a post goes to a channel: an empty override means the workspace's
 * active channels decide; otherwise only the channels it names.
 */
export function postGoesTo(override: string[] | null | undefined, channel: string): boolean {
  return !override || override.length === 0 || override.includes(channel);
}

/** A valid override: known channels, no repeats, at least one. Null when invalid. */
export function parsePostChannels(v: unknown): PostChannel[] | null {
  if (!Array.isArray(v)) return null;
  const set = new Set<string>();
  for (const c of v) {
    if (typeof c !== "string" || !(POST_CHANNELS as readonly string[]).includes(c)) return null;
    set.add(c);
  }
  return POST_CHANNELS.filter((c) => set.has(c));
}
