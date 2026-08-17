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
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.body_content !== undefined && { content: body.body_content }),
        ...(body.hook !== undefined && { hook: body.hook }),
        ...(body.core_argument !== undefined && { coreArgument: body.core_argument }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.claims_ok !== undefined && { claimsOk: body.claims_ok }),
        ...(body.published_at !== undefined && { publishedAt: new Date(body.published_at) }),
        ...(body.published_urls !== undefined && { publishedUrls: Array.isArray(body.published_urls) ? body.published_urls.join(",") : body.published_urls }),
        ...(body.linkedin_variant !== undefined && { linkedinVariant: body.linkedin_variant }),
        ...(body.facebook_variant !== undefined && { facebookVariant: body.facebook_variant }),
        ...(body.x_variant !== undefined && { xVariant: body.x_variant }),
        ...(body.variants?.linkedin !== undefined && { linkedinVariant: body.variants.linkedin }),
        ...(body.variants?.facebook !== undefined && { facebookVariant: body.variants.facebook }),
        ...(body.variants?.twitter !== undefined && { xVariant: body.variants.twitter }),
        updatedAt: new Date(),
      },
      include: {
        claims: true,
      },
    });

    // If this asset is PUBLISHED (or has a live blog entry), seamlessly sync changes to the live blogs table
    try {
      const existingBlog = await prisma.blog.findFirst({
        where: {
          OR: [{ assetId: id }, { slug: updated.slug }],
        },
      });

      if (existingBlog) {
        await prisma.blog.update({
          where: { slug: existingBlog.slug },
          data: {
            ...(body.title !== undefined && { title: body.title }),
            ...((body.content !== undefined || body.body_content !== undefined) && {
              content: body.content ?? body.body_content,
            }),
            ...(body.hook !== undefined && { hook: body.hook }),
            ...(body.core_argument !== undefined && { coreArgument: body.core_argument }),
            updatedAt: new Date(),
          },
        });
      }
    } catch (blogSyncErr) {
      console.warn("Non-fatal: could not sync updated asset to blogs table:", blogSyncErr);
    }

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    console.error("Error updating dynamic asset:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "unpublish"; // "unpublish" or "permanent"

    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // 1. Remove from live blogs table (so it immediately disappears from getminions.ai/blog)
    try {
      await prisma.blog.deleteMany({
        where: {
          OR: [{ assetId: asset.id }, { slug: asset.slug }],
        },
      });
    } catch (e) {
      console.warn("Could not delete from blogs table:", e);
    }

    // 2. Either unpublish back to draft OR permanently delete
    if (mode === "permanent") {
      await prisma.claim.deleteMany({ where: { assetId: asset.id } });
      await prisma.asset.delete({ where: { id: asset.id } });
      return NextResponse.json({ success: true, message: "Asset and live blog permanently deleted" });
    } else {
      const updated = await prisma.asset.update({
        where: { id: asset.id },
        data: {
          status: "PENDING_REVIEW",
          publishedAt: null,
          publishedUrls: null,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "Blog unpublished and reverted to review queue", asset: updated });
    }
  } catch (error) {
    console.error("Error deleting/unpublishing asset:", error);
    return NextResponse.json({ error: "Failed to delete/unpublish asset" }, { status: 500 });
  }
}
