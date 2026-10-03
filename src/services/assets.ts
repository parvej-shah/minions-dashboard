import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assetDTOSelect, toAssetDTO } from "@/lib/mappers/asset";
import { getTenantBlogDomain } from "@/lib/tenantDomain";
import { parsePostChannels } from "@/constants/postChannels";
import type { JsonObject } from "@/server/http/body";
import { badRequest, conflict, notFound } from "@/server/http/errors";
import { isPublished, refreshCoverIfStale } from "@/services/cover";
import { followUpNotReady } from "@/lib/followUp";
import { releaseIdeaForRedraft, removeFromBlog, syncAssetToBlog, type BlogEditFields } from "@/services/publishing";

export const ownedAssetWhere = (clientId: string, idOrSlug: string): Prisma.AssetWhereInput => ({
  OR: [{ id: idOrSlug }, { slug: idOrSlug }],
  clientId,
});

export async function requireOwnedAssetId(clientId: string, idOrSlug: string): Promise<string> {
  const asset = await prisma.asset.findFirst({ where: ownedAssetWhere(clientId, idOrSlug), select: { id: true } });
  if (!asset) throw notFound("Asset not found");
  return asset.id;
}

export async function listAssets(clientId: string) {
  const [assets, blogs, domain] = await Promise.all([
    prisma.asset.findMany({ where: { clientId }, select: assetDTOSelect, orderBy: { createdAt: "desc" } }),
    prisma.blog.findMany({ where: { clientId }, select: { slug: true, assetId: true } }),
    getTenantBlogDomain(clientId),
  ]);

  const liveSlugByAssetId = new Map(blogs.filter((blog) => blog.assetId).map((blog) => [blog.assetId as string, blog.slug]));
  const liveSlugs = new Set(blogs.map((blog) => blog.slug));

  return assets.map((asset) =>
    toAssetDTO(asset, liveSlugByAssetId.get(asset.id) ?? (liveSlugs.has(asset.slug) ? asset.slug : null), domain)
  );
}

export async function getAsset(clientId: string, idOrSlug: string) {
  const asset = await prisma.asset.findFirst({ where: ownedAssetWhere(clientId, idOrSlug), include: { claims: true } });
  if (!asset) throw notFound("Asset not found");
  return toAssetDTO(asset, null, await getTenantBlogDomain(clientId));
}

function parseChannelsChange(body: JsonObject, owned: { status: string; publishedAt: Date | null; followUpOf: string | null }): string[] | undefined {
  if (body.channels === undefined) return undefined;
  const parsed = body.channels === null ? [] : parsePostChannels(body.channels);
  if (parsed === null || (body.channels !== null && parsed.length === 0)) {
    throw badRequest("channels must name at least one of blog, linkedin, facebook (or be null for the workspace's)");
  }
  if (owned.status === "PUBLISHED" || owned.publishedAt) throw conflict("This post has gone out, so its channels can't change");
  if (owned.followUpOf) throw conflict("A second post goes to LinkedIn only");
  return parsed;
}

function assetUpdateData(body: JsonObject, channels: string[] | undefined): Prisma.AssetUncheckedUpdateInput {
  const has = (key: string) => body[key] !== undefined;
  const variants = (body.variants ?? {}) as Record<string, string | undefined>;
  const content = body.content ?? body.body_content;
  return {
    ...(channels !== undefined && { channels }),
    ...(has("title") && { title: body.title as string }),
    ...(content !== undefined && { content: content as string }),
    ...(has("hook") && { hook: body.hook as string }),
    ...(has("core_argument") && { coreArgument: body.core_argument as string }),
    ...(has("status") && { status: body.status as string }),
    ...((body.status === "PUBLISHED" || body.status === "PENDING_REVIEW") && { scheduledFor: null }),
    ...(has("claims_ok") && { claimsOk: body.claims_ok as string }),
    ...(has("published_at") && { publishedAt: body.published_at ? new Date(body.published_at as string) : null }),
    ...(has("published_urls") && {
      publishedUrls: Array.isArray(body.published_urls) ? body.published_urls.join(",") : (body.published_urls as string),
    }),
    ...(has("linkedin_variant") && { linkedinVariant: body.linkedin_variant as string }),
    ...(has("facebook_variant") && { facebookVariant: body.facebook_variant as string }),
    ...(has("x_variant") && { xVariant: body.x_variant as string }),
    ...(variants.linkedin !== undefined && { linkedinVariant: variants.linkedin }),
    ...(variants.facebook !== undefined && { facebookVariant: variants.facebook }),
    ...(variants.twitter !== undefined && { xVariant: variants.twitter }),
    updatedAt: new Date(),
  };
}

function blogEdits(body: JsonObject): BlogEditFields {
  const content = body.content ?? body.body_content;
  return {
    ...(body.title !== undefined && { title: body.title as string }),
    ...(content !== undefined && { content: content as string }),
    ...(body.hook !== undefined && { hook: body.hook as string }),
    ...(body.core_argument !== undefined && { coreArgument: body.core_argument as string }),
  };
}

const COVER_LINE = /^!\[[^\]]*\]\(([^)]*)\)/;

export async function updateAsset(clientId: string, idOrSlug: string, body: JsonObject) {
  if (body.status === "SCHEDULED") throw badRequest("Use POST /api/assets/{id}/schedule to schedule a post");

  const owned = await prisma.asset.findFirst({
    where: ownedAssetWhere(clientId, idOrSlug),
    select: { id: true, status: true, publishedAt: true, heroImageUrl: true, followUpOf: true, followUpFormat: true, carouselSpec: true },
  });
  if (!owned) throw notFound("Asset not found");
  // An editor open since the cover was redrawn still holds the old cover line,
  // whose file is deleted; the saved text always points at the current cover.
  const content = body.content ?? body.body_content;
  if (typeof content === "string" && owned.heroImageUrl) {
    const line = content.match(COVER_LINE);
    if (line && line[1] !== owned.heroImageUrl) {
      body = { ...body, content: content.replace(COVER_LINE, (m) => m.replace(line[1], owned.heroImageUrl!)) };
      delete body.body_content;
    }
  }

  // The cover must match what goes out: brought in line with the approved
  // text before a post is released, and after any change to its words.
  const goingOut = body.status === "PUBLISHED" && owned.status !== "PUBLISHED" && !owned.publishedAt;
  const notReady = goingOut ? followUpNotReady(owned) : null;
  if (notReady) throw conflict(notReady);
  if (goingOut) await refreshCoverIfStale(owned.id);
  let updated = await prisma.asset.update({
    where: { id: owned.id },
    data: assetUpdateData(body, parseChannelsChange(body, owned)),
    include: { claims: true },
  });
  const variants = (body.variants ?? {}) as Record<string, unknown>;
  const wordsChanged = body.title !== undefined || (body.content ?? body.body_content) !== undefined || body.linkedin_variant !== undefined || variants.linkedin !== undefined;
  if (wordsChanged && !goingOut && !isPublished(updated) && (await refreshCoverIfStale(owned.id))) {
    updated = await prisma.asset.findUniqueOrThrow({ where: { id: owned.id }, include: { claims: true } });
  }
  await syncAssetToBlog(updated, body.status as string | undefined, blogEdits(body));

  return toAssetDTO(updated, null, await getTenantBlogDomain(clientId));
}

export type AssetRemovalMode = "permanent" | "unpublish";

export async function removeAsset(clientId: string, idOrSlug: string, mode: AssetRemovalMode) {
  const asset = await prisma.asset.findFirst({ where: ownedAssetWhere(clientId, idOrSlug) });
  if (!asset) throw notFound("Asset not found");

  await removeFromBlog(asset.id, asset.slug, asset.clientId).catch((error) =>
    console.warn("[assets] Could not delete from blogs table:", error)
  );

  if (mode === "permanent") {
    if (asset.ideaId) await releaseIdeaForRedraft(asset.ideaId);
    await prisma.claim.deleteMany({ where: { assetId: asset.id } });
    await prisma.asset.delete({ where: { id: asset.id } });
    return null;
  }

  const reverted = await prisma.asset.update({
    where: { id: asset.id },
    data: { status: "PENDING_REVIEW", publishedAt: null, publishedUrls: null, updatedAt: new Date() },
    include: { claims: true },
  });
  return toAssetDTO(reverted, null, await getTenantBlogDomain(clientId));
}

export async function getCarouselPdfUrl(clientId: string, idOrSlug: string): Promise<string | undefined> {
  const asset = await prisma.asset.findFirst({ where: ownedAssetWhere(clientId, idOrSlug), select: { carouselSpec: true } });
  return (asset?.carouselSpec as { pdf_url?: string } | null)?.pdf_url;
}
