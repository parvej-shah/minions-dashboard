import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublishedDTO } from "@/lib/mappers/published";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const [assets, blogs] = await Promise.all([
      prisma.asset.findMany({ where: { clientId: ctx.clientId } }),
      prisma.blog.findMany({ where: { clientId: ctx.clientId }, orderBy: { publishedAt: "desc" } }),
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
