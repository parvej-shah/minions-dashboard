import type { DistributionChannelKey, DistributionPlatform } from "@/types";

/** The one distribution-channel catalogue, shared by the API and the UI. */
export interface DistributionChannelDefinition {
  id: string;
  key: DistributionChannelKey;
  /** Column key of the matching `brand_directives` row. */
  ruleKey: string;
  name: string;
  platform: DistributionPlatform;
  description: string;
  target_destination: string;
  defaultActive: boolean;
  badge: string;
}

/**
 * `target_destination` here is only the fallback shown before a tenant has
 * connected anything -- /api/channels overrides it per-tenant at request
 * time (their own site once a blog webhook is connected, or "Connected"
 * once a real external_id is on file for a social channel) rather than
 * serving this catalogue's copy verbatim. Every tenant reads this catalogue,
 * so the copy stays tenant-neutral (no "getminions.ai", no "@getminionsai").
 */
export const DISTRIBUTION_CHANNELS: readonly DistributionChannelDefinition[] = [
  {
    id: "DIR-DIST-BLOG",
    key: "blog",
    ruleKey: "auto_publish_blog",
    name: "Blog",
    platform: "BLOG",
    description: "Posts the full article on your blog.",
    target_destination: "Your Minions-hosted blog",
    defaultActive: true,
    badge: "",
  },
  {
    id: "DIR-DIST-FB",
    key: "facebook",
    ruleKey: "auto_publish_facebook",
    name: "Facebook Page",
    platform: "FACEBOOK",
    description: "Posts the cover image and post text to your Facebook Page, with the article link as the first comment.",
    target_destination: "Not connected yet",
    defaultActive: true,
    badge: "",
  },
  {
    id: "DIR-DIST-IG",
    key: "instagram",
    ruleKey: "auto_publish_instagram",
    name: "Instagram",
    platform: "INSTAGRAM",
    description: "Posts the carousel, or the cover image, with the Instagram caption to the account linked to your Facebook Page.",
    target_destination: "Not connected yet",
    defaultActive: false,
    badge: "",
  },
  {
    id: "DIR-DIST-LI",
    key: "linkedin",
    ruleKey: "auto_publish_linkedin",
    name: "LinkedIn",
    platform: "LINKEDIN",
    description: "Posts to your LinkedIn with the cover image or carousel, with the article link as the first comment.",
    target_destination: "Not connected yet",
    defaultActive: false,
    badge: "",
  },
  {
    id: "DIR-DIST-X",
    key: "x",
    ruleKey: "auto_publish_x",
    name: "X (Twitter)",
    platform: "TWITTER",
    description: "Posts a short version to your X feed, with the article link as the first reply.",
    target_destination: "Not connected yet",
    defaultActive: false,
    badge: "",
  },
] as const;

export function findChannelById(id: string): DistributionChannelDefinition | undefined {
  return DISTRIBUTION_CHANNELS.find((c) => c.id === id);
}

export function findChannelByKey(key: string): DistributionChannelDefinition | undefined {
  return DISTRIBUTION_CHANNELS.find((c) => c.key === key.toLowerCase());
}
