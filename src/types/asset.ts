import type { AudienceLane } from "./idea";

export type AssetStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "BLOCKED"
  | "REJECTED";

export type HeroStatus = "PENDING" | "READY" | "BLOCKED_BY_SAFETY" | "FAILED";

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

/** How a code-drawn cover was made (phase 5), for the cover editor. */
export interface CoverSpecDTO {
  layout: "HEADLINE" | "STATEMENT" | "QUOTE" | "NUMBER";
  label: string | null;
  headline: string;
  emphasis: string | null;
  kicker: string | null;
  quote: string | null;
  number: { value: string; unit?: string } | null;
  headline_source: string;
  /** Who the cover is signed by, so the feed preview can show the real author. */
  author: { name: string; role: string | null } | null;
  /** SHAPES, DOODLES, ICONS or NONE; null on covers drawn before illustrations existed. */
  art_style: string | null;
  /** Whether the illustration is on this cover (QUOTE and NUMBER have no room, a long headline may need it). */
  art_drawn: boolean;
  /** Why an option was not used: a strategist headline that failed, a figure the draft does not state. */
  notes: string[];
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
  /** From the draft check (phase 4): why it is blocked or needs review, then readability notes. */
  review_notes: string[];
  hero_image_url: string | null;
  hero_status: HeroStatus;
  hero_error_code: string | null;
  hero_provider: string | null;
  hero_attempts: number;
  /** Set when the cover was drawn in code; null for an AI image cover or none. */
  cover: CoverSpecDTO | null;
  doc_url: string;
  version: number;
  generation_cost: number;
  published_at: string | null;
  /** D18: channels this post is limited to; empty means the workspace's channels. */
  channels: string[];
  /** When a SCHEDULED post goes out (phase 7); kept after release as the record. */
  scheduled_for: string | null;
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
  /** What LinkedIn got with this draft, its carousel or its cover; null until it went to LinkedIn. */
  linkedin_went_as: "CAROUSEL" | "COVER" | null;
  /** A second LinkedIn post: the original draft's id, and the format it shares. Null on every other draft. */
  follow_up_of: string | null;
  follow_up_format: "CAROUSEL" | "COVER" | null;
  created_at: string;
  updated_at: string;
}
