import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAssetDTO } from "@/lib/mappers/asset";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const [assets, blogs] = await Promise.all([
      prisma.asset.findMany({
        include: { claims: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.blog.findMany({ select: { slug: true, assetId: true } }),
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
          liveSlugByAssetId.get(asset.id) ?? (liveSlugs.has(asset.slug) ? asset.slug : null)
        )
      )
    );
  } catch (error) {
    return apiError(error, "Failed to fetch assets");
  }
}
