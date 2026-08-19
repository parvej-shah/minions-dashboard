import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublishedDTO } from "@/lib/mappers/published";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const [assets, blogs] = await Promise.all([
      prisma.asset.findMany(),
      prisma.blog.findMany({ orderBy: { publishedAt: "desc" } }),
    ]);

    const assetsById = new Map(assets.map((a) => [a.id, a]));
    const assetsBySlug = new Map(assets.map((a) => [a.slug, a]));

    const feed = blogs.map((blog, index) =>
      toPublishedDTO(
        blog,
        (blog.assetId ? assetsById.get(blog.assetId) : undefined) ?? assetsBySlug.get(blog.slug),
        index
      )
    );

    return NextResponse.json(feed);
  } catch (error) {
    return apiError(error, "Failed to fetch published feed");
  }
}
