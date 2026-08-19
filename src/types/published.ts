import type { AudienceLane } from "./idea";
import type { SocialVariants } from "./asset";
import type { ChannelUrls } from "@/lib/channels";

export type PublishedPlatform = "BLOG" | "LINKEDIN" | "FACEBOOK" | "TWITTER";

export interface PublishedPostRecord {
  id: string;
  /** Null when the blog row has no matching asset — never a fabricated id. */
  asset_id: string | null;
  platform: PublishedPlatform;
  title: string;
  excerpt: string;
  hero_image_url: string;
  published_url: string;
  audience: AudienceLane;
  /** Recorded generation cost, or null when no asset backs this post. */
  cost_usd: number | null;
  published_at: string;
  first_comment: string;
  variants: SocialVariants;
  /**
   * Recorded permalink per social channel, or null where nothing is recorded.
   * Posting is manual, so null means "no evidence it went out", not "failed".
   */
  channel_urls: ChannelUrls;
}
