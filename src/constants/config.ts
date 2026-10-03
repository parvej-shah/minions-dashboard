/**
 * Application-wide configuration constants.
 *
 * Anything repeated across route handlers and components lives here, so a change is one edit.
 */

/**
 * Fallback public blog host, used only when a tenant has not set its own
 * `BrandProfile.companyDomain`. Standardised without `www.` (both were in use).
 *
 * This is NOT "the" blog host: every tenant publishes to its own domain, so
 * anything building a public post URL must pass that tenant's domain to
 * `blogUrl()`. Defaulting silently to getminions.ai is how other tenants'
 * posts, first-comment backlinks, and "Live on Blog" buttons ended up
 * pointing at this company's site.
 */
export const BLOG_BASE_URL = "https://getminions.ai";

/**
 * Normalises a tenant-entered domain into an absolute origin.
 * Accepts "acme.com", "https://acme.com", or "https://acme.com/" alike, and
 * returns null for blank input so callers can fall back deliberately.
 */
export function normalizeDomain(domain: string | null | undefined): string | null {
  const trimmed = (domain || "").trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Builds the canonical public URL for a published post, or null when the
 * tenant has no site of its own.
 *
 * `domain` is the owning tenant's `BrandProfile.companyDomain`. There is no
 * fallback: a tenant without a domain has no public blog (03 skips the blog
 * step for it), and falling back to getminions.ai gave its drafts a first
 * comment linking to a Minions 404 page.
 */
export function blogUrl(slug: string, domain?: string | null): string | null {
  const base = normalizeDomain(domain);
  return base ? `${base}/blog/${slug}` : null;
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
    model: "AI Core Max",
    stage: "01 Harvest · 02 Stage 1",
    rate: "$0.002 / 1k tokens",
    role: "Signal harvesting and strategist thesis defense",
    accent: "#00C9A7",
  },
  {
    model: "AI Core Flash",
    stage: "01 Refine · 02 Stage 4",
    rate: "$0.0001 / 1k tokens",
    role: "Idea refinement and omnichannel social variants",
    accent: "#8B5CF6",
  },
  {
    model: "AI Core Plus",
    stage: "02 Stage 2",
    rate: "$0.0004 / 1k tokens",
    role: "Staff Writer 800–1200w long-form prose",
    accent: "#F1F5F9",
  },
  {
    model: "AI Core Flash",
    stage: "02 Stage 3",
    rate: "$0.0001 / 1k tokens",
    role: "Lead Editorial Reviewer claims classification",
    accent: "#3B82F6",
  },
  {
    model: "AI Image Generation",
    stage: "02 Cover Art",
    rate: "$0.025 / image",
    role: "1280×720 commercial studio cover generation",
    accent: "#F59E0B",
  },
] as const;

/**
 * Timezone for a workspace that hasn't set its own (Bangladesh, where the
 * team is). Matches the `clients.timezone` column default; the Weekly Pulse
 * card still offers the browser's timezone until the user confirms one.
 */
export const DEFAULT_TIMEZONE = "Asia/Dhaka";
