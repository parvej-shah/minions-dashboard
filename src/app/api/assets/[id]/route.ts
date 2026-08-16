import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        claims: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const formatted = {
      id: asset.id,
      title: asset.title,
      slug: asset.slug,
      hook: asset.hook || "",
      core_argument: asset.coreArgument || "",
      audience: asset.audience,
      pillar: asset.pillar,
      target_trade: asset.targetTrade || "HVAC",
      status: asset.status,
      claims_ok: asset.claimsOk,
      hero_image_url: asset.heroImageUrl || "/images/social-covers/twitter/twitter_cover_dark.png",
      doc_url: asset.docUrl || `https://getminions.ai/blog/${asset.slug}`,
      version: asset.version || 1,
      generation_cost: Number(asset.generationCost) || 0.038,
      published_at: asset.publishedAt ? asset.publishedAt.toISOString() : null,
      published_urls: asset.publishedUrls ? asset.publishedUrls.split(",") : [],
      body_content: asset.content,
      variants: {
        linkedin: asset.linkedinVariant || "",
        facebook: asset.facebookVariant || "",
        twitter: asset.xVariant || "",
      },
      claims: asset.claims.map((c) => ({
        id: c.id,
        claim_text: c.claimText,
        claim_type: c.claimType,
        source: c.source || "",
        verified: c.verified as "Y" | "N",
        confidence_score: Number(c.confidenceScore) || 0.95,
        notes: c.notes || "",
      })),
      created_at: asset.createdAt.toISOString(),
      updated_at: asset.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching dynamic asset by ID:", error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.status && { status: body.status }),
        ...(body.claims_ok && { claimsOk: body.claims_ok }),
        ...(body.published_at && { publishedAt: new Date(body.published_at) }),
        ...(body.published_urls && { publishedUrls: Array.isArray(body.published_urls) ? body.published_urls.join(",") : body.published_urls }),
        updatedAt: new Date(),
      },
      include: {
        claims: true,
      },
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    console.error("Error updating dynamic asset:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}
