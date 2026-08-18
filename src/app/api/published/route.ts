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
}

export async function GET() {
  try {
    const allAssets = await prisma.asset.findMany();
    const publishedAssets = allAssets.filter((a) => a.status === "PUBLISHED");

    const publishedBlogs = await prisma.blog.findMany({
      orderBy: {
        publishedAt: "desc",
      },
    });

    const feed: PublishedPostRecord[] = [];

    // 1. Map dynamic blog posts from Supabase blogs table
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
      });
    }

    // 2. Map dynamic social variants from published assets in PostgreSQL
    for (const a of publishedAssets) {
      const cost = Number(a.generationCost) || 0.0386;
      const pubDate = a.publishedAt ? a.publishedAt.toISOString() : a.createdAt.toISOString();
      const heroCover = a.heroImageUrl || "/images/social-covers/linkedin/linkedin_cover_dark.png";

      if (a.linkedinVariant) {
        feed.push({
          id: `PUB-LI-${a.id}`,
          asset_id: a.id,
          platform: "LINKEDIN",
          title: a.title,
          excerpt: a.linkedinVariant.slice(0, 180),
          hero_image_url: heroCover,
          published_url: "https://www.linkedin.com/company/getminionsai",
          audience: (a.audience || "ICP") as "ICP" | "PEER" | "BRIDGE",
          cost_usd: cost,
          published_at: pubDate,
          first_comment: `Read the full operational breakdown: https://www.getminions.ai/blog/${a.slug}`,
        });
      }

      if (a.facebookVariant) {
        feed.push({
          id: `PUB-FB-${a.id}`,
          asset_id: a.id,
          platform: "FACEBOOK",
          title: a.title,
          excerpt: a.facebookVariant.slice(0, 180),
          hero_image_url: heroCover,
          published_url: "https://www.facebook.com/getminionsai",
          audience: (a.audience || "ICP") as "ICP" | "PEER" | "BRIDGE",
          cost_usd: cost,
          published_at: pubDate,
          first_comment: `Full case study on https://www.getminions.ai/blog/${a.slug}`,
        });
      }

      if (a.xVariant) {
        feed.push({
          id: `PUB-X-${a.id}`,
          asset_id: a.id,
          platform: "TWITTER",
          title: a.title,
          excerpt: a.xVariant.slice(0, 180),
          hero_image_url: heroCover,
          published_url: "https://twitter.com/getminionsai",
          audience: (a.audience || "ICP") as "ICP" | "PEER" | "BRIDGE",
          cost_usd: cost,
          published_at: pubDate,
          first_comment: `Technical benchmark: https://www.getminions.ai/blog/${a.slug}`,
        });
      }
    }

    return NextResponse.json(feed);
  } catch (error) {
    console.error("Error fetching dynamic published feed from Prisma:", error);
    return NextResponse.json({ error: "Failed to fetch published feed" }, { status: 500 });
  }
}
