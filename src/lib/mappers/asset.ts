import type { Asset, Claim } from "@prisma/client";
import {
  DEFAULT_CLAIM_CONFIDENCE,
  DEFAULT_GENERATION_COST,
  UNSPECIFIED_TRADE,
  blogUrl,
} from "@/constants/config";
import type { AssetItem, AssetStatus, ClaimCheckItem, CoverSpecDTO } from "@/types";
import type { AudienceLane } from "@/types";

type AssetWithClaims = Asset & { claims: Claim[] };

/**
 * `published_urls` has been written in two formats: comma-joined (the assets
 * PATCH route) and a JSON array string (the publish webhook, before it was
 * corrected). Rows in both formats are already in the database, so read both.
 */
export function parsePublishedUrls(raw: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) =>
            typeof entry === "string"
              ? entry
              : typeof entry === "object" && entry !== null && "url" in entry
                ? String((entry as { url: unknown }).url)
                : ""
          )
          .filter(Boolean);
      }
    } catch {
      // Fall through to the comma split below.
    }
  }
  return trimmed.split(",").map((url) => url.trim()).filter(Boolean);
}

export function toClaimDTO(claim: Claim): ClaimCheckItem {
  return {
    id: claim.id,
    claim_text: claim.claimText,
    claim_type: claim.claimType,
    source: claim.source ?? "",
    verified: claim.verified as ClaimCheckItem["verified"],
    confidence_score: Number(claim.confidenceScore) || DEFAULT_CLAIM_CONFIDENCE,
    notes: claim.notes ?? "",
  };
}

/**
 * The single Prisma-row -> wire-shape conversion for an editorial asset.
 *
 * The list and by-id routes previously had byte-identical copies of this that
 * disagreed on one thing: the missing-trade fallback was "HVAC" in one and
 * "UNSPECIFIED" in the other. It is UNSPECIFIED everywhere now — a missing
 * trade is never presented as a real one.
 */
function toCoverDTO(raw: unknown): CoverSpecDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  if (!str(c.layout) || !str(c.headline)) return null;
  const number = c.number && typeof c.number === "object" ? (c.number as { value: string; unit?: string }) : null;
  const a = c.author && typeof c.author === "object" ? (c.author as Record<string, unknown>) : null;
  const author = a && str(a.name) ? { name: String(a.name), role: str(a.role) } : null;
  return {
    layout: c.layout as CoverSpecDTO["layout"],
    label: str(c.label),
    headline: String(c.headline),
    emphasis: str(c.emphasis),
    kicker: str(c.kicker),
    quote: str(c.quote),
    number,
    headline_source: str(c.headline_source) ?? "strategist",
    author,
    art_style: str(c.art_style),
    art_drawn: c.art_drawn === true,
    notes: Array.isArray(c.notes) ? c.notes.filter((n): n is string => typeof n === "string") : [],
  };
}

export function toAssetDTO(
  asset: AssetWithClaims,
  liveBlogSlug?: string | null,
  /** Owning tenant's BrandProfile.companyDomain; without it the URL falls back
   * to getminions.ai and advertises the wrong company's site. */
  domain?: string | null
): AssetItem {
  return {
    id: asset.id,
    title: asset.title,
    slug: asset.slug,
    hook: asset.hook ?? "",
    core_argument: asset.coreArgument ?? "",
    audience: asset.audience as AudienceLane,
    pillar: asset.pillar,
    target_trade: asset.targetTrade || UNSPECIFIED_TRADE,
    status: asset.status as AssetStatus,
    claims_ok: asset.claimsOk,
    review_notes: asset.reviewNotes ?? [],
    hero_image_url: asset.heroImageUrl,
    hero_status: (asset.heroStatus || "READY") as AssetItem["hero_status"],
    hero_error_code: asset.heroErrorCode,
    hero_provider: asset.heroProvider,
    hero_attempts: asset.heroAttempts ?? 0,
    cover: toCoverDTO(asset.coverSpec),
    doc_url: asset.docUrl || blogUrl(asset.slug, domain) || "",
    version: asset.version || 1,
    generation_cost: Number(asset.generationCost) || DEFAULT_GENERATION_COST,
    published_at: asset.publishedAt ? asset.publishedAt.toISOString() : null,
    published_urls: parsePublishedUrls(asset.publishedUrls),
    live_blog_url: liveBlogSlug ? blogUrl(liveBlogSlug, domain) : null,
    body_content: asset.content,
    variants: {
      linkedin: asset.linkedinVariant ?? "",
      facebook: asset.facebookVariant ?? "",
      twitter: asset.xVariant ?? "",
    },
    claims: asset.claims.map(toClaimDTO),
    created_at: asset.createdAt.toISOString(),
    updated_at: asset.updatedAt.toISOString(),
  };
}
