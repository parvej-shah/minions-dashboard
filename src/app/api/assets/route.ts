import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assetDTOSelect, toAssetDTO } from "@/lib/mappers/asset";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { getTenantBlogDomain } from "@/lib/tenantDomain";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const [assets, blogs, domain] = await Promise.all([
      prisma.asset.findMany({
        where: { clientId: ctx.clientId },
        // Omit relations, provider IDs, and carousel plans that the Studio DTO never uses.
        select: assetDTOSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.blog.findMany({ where: { clientId: ctx.clientId }, select: { slug: true, assetId: true } }),
      getTenantBlogDomain(ctx.clientId),
    ]);

    // A blog row is the only record that a post is actually live; the asset's
    // own status is not reliable (see `live_blog_url` on AssetItem).
    const liveSlugByAssetId = new Map(
      blogs.filter((b) => b.assetId).map((b) => [b.assetId as string, b.slug])
    );
    const liveSlugs = new Set(blogs.map((b) => b.slug));

    return NextResponse.json(
      assets.map((asset) =>
        toAssetDTO(
          asset,
          liveSlugByAssetId.get(asset.id) ?? (liveSlugs.has(asset.slug) ? asset.slug : null),
          domain
        )
      )
    );
  } catch (error) {
    return apiError(error, "Failed to fetch assets");
  }
}
