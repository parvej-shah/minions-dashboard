/**
 * Which social channel a recorded post URL belongs to.
 *
 * Social posting is manual — the cockpit hands the operator ready-to-post copy
 * and a share link, and nothing observes the networks. The only evidence a post
 * went out is a URL written back into `assets.published_urls`, so that column is
 * the single source of "posted" status.
 */
export type SocialChannel = "linkedin" | "facebook" | "twitter";

export interface ChannelUrls {
  linkedin: string | null;
  facebook: string | null;
  twitter: string | null;
}

export const EMPTY_CHANNEL_URLS: ChannelUrls = {
  linkedin: null,
  facebook: null,
  twitter: null,
};

/** Host fragments that identify each channel. */
const CHANNEL_HOSTS: Record<SocialChannel, string[]> = {
  linkedin: ["linkedin.com", "lnkd.in"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  twitter: ["twitter.com", "x.com", "t.co"],
};

export function channelOf(url: string): SocialChannel | null {
  const lower = url.toLowerCase();
  for (const [channel, hosts] of Object.entries(CHANNEL_HOSTS) as [SocialChannel, string[]][]) {
    if (hosts.some((host) => lower.includes(host))) return channel;
  }
  return null;
}

/**
 * Sorts recorded post URLs into their channels.
 *
 * The first URL found for a channel wins; later ones are ignored rather than
 * merged, because a second URL for the same channel is a data problem, not a
 * second post to display.
 */
/**
 * The public link for a LinkedIn post id as the publisher stores it
 * (`urn:li:share:…` or `urn:li:ugcPost:…`). LinkedIn resolves any post urn at
 * /feed/update/.
 */
export function linkedinPostUrl(urn: string | null | undefined): string | null {
  const id = urn?.trim();
  return id && /^urn:li:(share|ugcPost|activity):\d+$/.test(id) ? `https://www.linkedin.com/feed/update/${id}/` : null;
}

export function toChannelUrls(urls: string[]): ChannelUrls {
  const result: ChannelUrls = { ...EMPTY_CHANNEL_URLS };
  for (const url of urls) {
    const channel = channelOf(url);
    if (channel && !result[channel]) result[channel] = url;
  }
  return result;
}
