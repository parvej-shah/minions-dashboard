/**
 * Application-wide configuration constants.
 *
 * Anything that was previously a string literal repeated across route handlers
 * and components lives here, so a change is one edit rather than a find-and-replace.
 */

/** Canonical public blog host. Standardised without `www.` (both were in use). */
export const BLOG_BASE_URL = "https://getminions.ai";

/** Builds the canonical public URL for a published post. */
export function blogUrl(slug: string): string {
  return `${BLOG_BASE_URL}/blog/${slug}`;
}

/** Fallback hero image when an asset has none. */
export const DEFAULT_HERO_IMAGE = "/images/social-covers/twitter/twitter_cover_dark.png";

/** Author avatar used when syncing an asset into the public blog table. */
export const BLOG_AUTHOR_AVATAR = `${BLOG_BASE_URL}/images/minions_ai_logo_primary_transparent.png`;

/** Cost assumed for an asset whose generation cost was never recorded. */
export const DEFAULT_GENERATION_COST = 0.038;

/** Confidence assumed for a claim with no recorded score. */
export const DEFAULT_CLAIM_CONFIDENCE = 0.95;

/**
 * Trade shown when a record has no target trade.
 * Never guess a real trade for missing data.
 */
export const UNSPECIFIED_TRADE = "UNSPECIFIED";

/** n8n automation endpoints. All are called server-side only. */
export const N8N_WEBHOOKS = {
  harvest: "https://n8n.getminions.ai/webhook/test-harvester",
  draft: "https://n8n.getminions.ai/webhook/test-idea-to-asset",
  publish: "https://n8n.getminions.ai/webhook/publish-approved-asset",
} as const;

/** Primary logo, served from the public R2 bucket. */
export const PRIMARY_LOGO_URL =
  "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/minions_logo_primary.svg";

/** Positioning line handed to the drafting pipeline. */
export const BRAND_POSITIONING =
  "AI operations partner for US home-services businesses (1-10 techs)";

/** Public social profiles linked from the dashboard. */
export const SOCIAL_PROFILES = {
  linkedin: "https://linkedin.com/company/getminionsai",
  facebook: "https://facebook.com/getminionsai",
  twitter: "https://twitter.com/getminionsai",
} as const;

/**
 * Operator-maintained model rate card, shown on the telemetry page.
 *
 * These are list prices someone has to keep in step with the provider's
 * pricing page — they are NOT measured from any run, and nothing in the app
 * computes a cost from them. The UI labels them as such so they are never
 * mistaken for observed spend; recorded `generation_cost` is the real figure.
 */
export const MODEL_RATE_CARD = [
  {
    model: "qwen3.7-max",
    stage: "01 Harvest · 02 Stage 1",
    rate: "$0.002 / 1k tokens",
    role: "Signal harvesting and strategist thesis defense",
    accent: "#00C9A7",
  },
  {
    model: "qwen-flash",
    stage: "01 Refine · 02 Stage 4",
    rate: "$0.0001 / 1k tokens",
    role: "Idea refinement and omnichannel social variants",
    accent: "#8B5CF6",
  },
  {
    model: "qwen-plus",
    stage: "02 Stage 2",
    rate: "$0.0004 / 1k tokens",
    role: "Staff Writer 800–1200w long-form prose",
    accent: "#F1F5F9",
  },
  {
    model: "qwen3.7-flash",
    stage: "02 Stage 3",
    rate: "$0.0001 / 1k tokens",
    role: "Lead Editorial Reviewer claims classification",
    accent: "#3B82F6",
  },
  {
    model: "qwen-image-3.0-pro",
    stage: "02 Cover Art",
    rate: "$0.025 / image",
    role: "1280×720 commercial studio cover generation",
    accent: "#F59E0B",
  },
] as const;
