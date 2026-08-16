import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        claims: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format to frontend AssetItem interface
    const formatted = assets.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      hook: a.hook || "",
      core_argument: a.coreArgument || "",
      audience: a.audience,
      pillar: a.pillar,
      target_trade: a.targetTrade || "HVAC",
      status: a.status,
      claims_ok: a.claimsOk,
      hero_image_url: a.heroImageUrl || "/images/social-covers/twitter/twitter_cover_dark.png",
      doc_url: a.docUrl || `https://getminions.ai/blog/${a.slug}`,
      version: a.version || 1,
      generation_cost: Number(a.generationCost) || 0.038,
      published_at: a.publishedAt ? a.publishedAt.toISOString() : null,
      published_urls: a.publishedUrls ? a.publishedUrls.split(",") : [],
      body_content: a.content,
      variants: {
        linkedin: a.linkedinVariant || "",
        facebook: a.facebookVariant || "",
        twitter: a.xVariant || "",
      },
      claims: a.claims.map((c) => ({
        id: c.id,
        claim_text: c.claimText,
        claim_type: c.claimType,
        source: c.source || "",
        verified: c.verified as "Y" | "N",
        confidence_score: Number(c.confidenceScore) || 0.95,
        notes: c.notes || "",
      })),
      created_at: a.createdAt.toISOString(),
      updated_at: a.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching dynamic assets from Prisma:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
