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
    name: "Company Blog",
    platform: "BLOG",
    description:
      "Publishes live long-form editorial breakdown to your blog with structured metadata.",
    target_destination: "Shared hosted blog",
    defaultActive: true,
    badge: "Core Web",
  },
  {
    id: "DIR-DIST-FB",
    key: "facebook",
    ruleKey: "auto_publish_facebook",
    name: "Facebook Business Page",
    platform: "FACEBOOK",
    description:
      "Publishes high-res photo post to your Facebook Page timeline + automated first-comment blog URL.",
    target_destination: "Not connected yet",
    defaultActive: true,
    badge: "Graph API v20",
  },
  {
    id: "DIR-DIST-LI",
    key: "linkedin",
    ruleKey: "auto_publish_linkedin",
    name: "LinkedIn Company Page",
    platform: "LINKEDIN",
    description:
      "Broadcasts formatted executive post to your LinkedIn followers + automated first-comment link.",
    target_destination: "Not connected yet",
    defaultActive: false,
    badge: "Community API",
  },
  {
    id: "DIR-DIST-X",
    key: "x",
    ruleKey: "auto_publish_x",
    name: "Twitter / X Feed",
    platform: "TWITTER",
    description:
      "Broadcasts concise hook post to your X feed with hashtag tags + automated first-reply link.",
    target_destination: "Not connected yet",
    defaultActive: false,
    badge: "OAuth 2.0",
  },
] as const;

export function findChannelById(id: string): DistributionChannelDefinition | undefined {
  return DISTRIBUTION_CHANNELS.find((c) => c.id === id);
}

export function findChannelByKey(key: string): DistributionChannelDefinition | undefined {
  return DISTRIBUTION_CHANNELS.find((c) => c.key === key.toLowerCase());
}
