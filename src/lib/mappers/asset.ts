import type { Prisma } from "@prisma/client";
import {
  DEFAULT_CLAIM_CONFIDENCE,
  DEFAULT_GENERATION_COST,
  UNSPECIFIED_TRADE,
  blogUrl,
} from "@/constants/config";
import type { AssetItem, AssetStatus, ClaimCheckItem, CoverSpecDTO } from "@/types";
import type { PosterShape } from "@/lib/covers/shape";
import { bodyOf, pickQuote, quoteSource } from "@/lib/covers/copy";
import type { AudienceLane } from "@/types";
import { linkedinWentAs, type FollowUpFormat } from "@/lib/followUp";
import { linkedinPostUrl, toChannelUrls } from "@/lib/channels";

export const assetDTOSelect = {
  id: true, title: true, slug: true, hook: true, coreArgument: true, content: true,
  audience: true, pillar: true, targetTrade: true, status: true, claimsOk: true,
  reviewNotes: true, coverSpec: true, heroImageUrl: true, heroStatus: true,
  heroErrorCode: true, heroProvider: true, heroAttempts: true, docUrl: true,
  linkedinVariant: true, facebookVariant: true, xVariant: true, instagramVariant: true, version: true,
  generationCost: true, channels: true, scheduledFor: true, publishedAt: true,
  publishedUrls: true, createdAt: true, updatedAt: true,
  linkedinPublishedAt: true, linkedinPostId: true, carouselSpec: true, followUpOf: true, followUpFormat: true,
  claims: {
    select: {
      id: true, claimText: true, claimType: true, source: true, verified: true,
      confidenceScore: true, notes: true,
    },
  },
} satisfies Prisma.AssetSelect;

type AssetWithClaims = Prisma.AssetGetPayload<{ select: typeof assetDTOSelect }>;
type ClaimDTORecord = AssetWithClaims["claims"][number];

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

export function toClaimDTO(claim: ClaimDTORecord): ClaimCheckItem {
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
 * A missing trade is UNSPECIFIED, never presented as a real one.
 */
function toCoverDTO(raw: unknown, draft: { content: string | null; linkedinVariant: string | null }): CoverSpecDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  if (!str(c.layout) || !str(c.headline)) return null;
  const number = c.number && typeof c.number === "object" ? (c.number as { value: string; unit?: string }) : null;
  const a = c.author && typeof c.author === "object" ? (c.author as Record<string, unknown>) : null;
  const author = a && str(a.name) ? { name: String(a.name), role: str(a.role) } : null;
  const card = c.card && typeof c.card === "object" ? (c.card as { shape?: PosterShape }) : null;
  const shape = card?.shape && typeof card.shape === "object" ? card.shape : null;
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
    list: shape?.list?.items ?? null,
    grid: shape?.grid?.items ?? null,
    punch: shape?.punch ?? null,
    shape_read: Boolean(shape),
    photo_ok: a?.photo_ok === true,
    cutout_ok: typeof a?.cutout_ok === "boolean" ? a.cutout_ok : null,
    quote_ok: Boolean(pickQuote(quoteSource({ body: bodyOf(draft.content ?? ""), post: draft.linkedinVariant }))),
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
    cover: toCoverDTO(asset.coverSpec, asset),
    doc_url: asset.docUrl || blogUrl(asset.slug, domain) || "",
    version: asset.version || 1,
    generation_cost: Number(asset.generationCost) || DEFAULT_GENERATION_COST,
    published_at: asset.publishedAt ? asset.publishedAt.toISOString() : null,
    channels: asset.channels ?? [],
    scheduled_for: asset.scheduledFor ? asset.scheduledFor.toISOString() : null,
    published_urls: parsePublishedUrls(asset.publishedUrls),
    live_blog_url: liveBlogSlug ? blogUrl(liveBlogSlug, domain) : null,
    body_content: asset.content,
    variants: {
      linkedin: asset.linkedinVariant ?? "",
      facebook: asset.facebookVariant ?? "",
      twitter: asset.xVariant ?? "",
      instagram: asset.instagramVariant ?? "",
    },
    claims: asset.claims.map(toClaimDTO),
    linkedin_went_as: linkedinWentAs(asset),
    linkedin_url: toChannelUrls(parsePublishedUrls(asset.publishedUrls)).linkedin ?? linkedinPostUrl(asset.linkedinPostId),
    linkedin_published_at: asset.linkedinPublishedAt ? asset.linkedinPublishedAt.toISOString() : null,
    linkedin_removable: Boolean(asset.linkedinPostId),
    follow_up_of: asset.followUpOf,
    follow_up_format: (asset.followUpFormat as FollowUpFormat | null) ?? null,
    created_at: asset.createdAt.toISOString(),
    updated_at: asset.updatedAt.toISOString(),
  };
}
