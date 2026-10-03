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

/**
 * Timezone for a workspace that hasn't set its own (Bangladesh, where the
 * team is). Matches the `clients.timezone` column default; the Weekly Pulse
 * card still offers the browser's timezone until the user confirms one.
 */
export const DEFAULT_TIMEZONE = "Asia/Dhaka";
