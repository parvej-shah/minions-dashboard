import type { DistributionChannelKey, DistributionPlatform } from "@/types";

/**
 * The one distribution-channel catalogue.
 *
 * This list previously existed twice — once in the API route (with `ruleKey`
 * and `defaultActive`) and once as a client-side fallback — with the same
 * strings copied between them.
 */
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

export const DISTRIBUTION_CHANNELS: readonly DistributionChannelDefinition[] = [
  {
    id: "DIR-DIST-BLOG",
    key: "blog",
    ruleKey: "auto_publish_blog",
    name: "Minions Public Blog",
    platform: "BLOG",
    description:
      "Publishes live long-form editorial breakdown directly to getminions.ai/blog with structured metadata.",
    target_destination: "getminions.ai/blog",
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
      "Publishes high-res photo post to Minions.AI timeline + automated first-comment blog URL.",
    target_destination: "facebook.com/getminionsai",
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
      "Broadcasts formatted executive post to LinkedIn followers + automated first-comment link.",
    target_destination: "linkedin.com/company/getminions",
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
      "Broadcasts concise hook post to @getminionsai with hashtag tags + automated first-reply link.",
    target_destination: "x.com/getminionsai",
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
