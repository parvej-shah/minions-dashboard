import type { AudienceLane } from "./idea";

export type AssetStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "BLOCKED"
  | "REJECTED";

export type HeroStatus = "READY" | "BLOCKED_BY_SAFETY" | "FAILED";

export type SocialPlatform = "LINKEDIN" | "FACEBOOK" | "TWITTER" | "NEWSLETTER";

export interface ClaimCheckItem {
  id: string;
  claim_text: string;
  claim_type: string;
  source: string;
  verified: "Y" | "N" | "NA";
  confidence_score: number;
  notes: string;
}

/** The three social bodies carried alongside an asset. */
export interface SocialVariants {
  linkedin: string;
  facebook: string;
  twitter: string;
}

/**
 * The single wire shape for an editorial asset, emitted by every
 * /api/assets endpoint.
 */
export interface AssetItem {
  id: string;
  title: string;
  slug: string;
  hook: string;
  core_argument: string;
  audience: AudienceLane;
  pillar: string;
  target_trade: string;
  status: AssetStatus;
  claims_ok: string | null;
  hero_image_url: string | null;
  hero_status: HeroStatus;
  hero_error_code: string | null;
  hero_provider: string | null;
  hero_attempts: number;
  doc_url: string;
  version: number;
  generation_cost: number;
  published_at: string | null;
  published_urls: string[];
  /**
   * Permalink of the blog row that already carries this asset, or null.
   *
   * A draft can sit in PENDING_REVIEW while its post is already live (the
   * publisher workflow writes the blog row but does not always flip the asset
   * status back). The Studio needs to know, or the operator republishes a post
   * that is already up.
   */
  live_blog_url: string | null;
  body_content: string;
  variants: SocialVariants;
  claims: ClaimCheckItem[];
  created_at: string;
  updated_at: string;
}
