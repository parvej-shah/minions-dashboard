import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface PublishedPostRecord {
  id: string;
  asset_id: string;
  platform: "BLOG" | "LINKEDIN" | "FACEBOOK" | "TWITTER";
  title: string;
  excerpt: string;
  hero_image_url: string;
  published_url: string;
  audience: "ICP" | "PEER" | "BRIDGE";
  cost_usd: number;
  published_at: string;
  first_comment?: string;
  variants?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
}

export async function GET() {
  try {
    const allAssets = await prisma.asset.findMany();
    const publishedBlogs = await prisma.blog.findMany({
      orderBy: {
        publishedAt: "desc",
      },
    });

    const feed: PublishedPostRecord[] = [];

    // Map published blog posts with their omnichannel distribution channels
    for (let i = 0; i < publishedBlogs.length; i++) {
      const b = publishedBlogs[i];
      const matchedAsset = allAssets.find(
        (a) => (b.assetId && a.id === b.assetId) || a.slug === b.slug
      );

      let heroImg = matchedAsset?.heroImageUrl || "/images/social-covers/github/github_social_dark.png";
      const imgMatch = (b.content || "").match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
      if (imgMatch && imgMatch[1]) {
        heroImg = imgMatch[1];
      }

      const cost = Number(matchedAsset?.generationCost) || 0.0386;

      feed.push({
        id: `PUB-BLOG-${b.assetId || b.slug || i + 1}`,
        asset_id: matchedAsset?.id || b.assetId || `ASSET-${String(i + 1).padStart(4, "0")}`,
        platform: "BLOG",
        title: b.title || matchedAsset?.title || "Untitled Post",
        excerpt: b.hook || b.coreArgument || matchedAsset?.hook || (b.content || "").slice(0, 160),
        hero_image_url: heroImg,
        published_url: `https://www.getminions.ai/blog/${b.slug}`,
        audience: (b.audience || matchedAsset?.audience || "ICP") as "ICP" | "PEER" | "BRIDGE",
        cost_usd: cost,
        published_at: b.publishedAt ? b.publishedAt.toISOString() : matchedAsset?.publishedAt ? matchedAsset.publishedAt.toISOString() : new Date().toISOString(),
        first_comment: `Read the full engineering deep dive: https://www.getminions.ai/blog/${b.slug}`,
        variants: {
          linkedin: matchedAsset?.linkedinVariant || "",
          facebook: matchedAsset?.facebookVariant || "",
          twitter: matchedAsset?.xVariant || "",
        },
      });
    }

    return NextResponse.json(feed);
  } catch (error) {
    console.error("Error fetching dynamic published feed from Prisma:", error);
    return NextResponse.json({ error: "Failed to fetch published feed" }, { status: 500 });
  }
}
