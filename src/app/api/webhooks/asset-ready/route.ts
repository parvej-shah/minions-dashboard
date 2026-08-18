import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSecret } from "@/lib/security";

export async function POST(request: Request) {
  const authCheck = verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const assetId = body.assetId || body.id || `ASSET-${Date.now()}`;
    const slug = body.slug || (body.title || "untitled-post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const asset = await prisma.asset.upsert({
      where: { id: assetId },
      update: {
        title: body.title,
        slug,
        hook: body.hook || "",
        coreArgument: body.core_argument || body.coreArgument || "",
        content: body.content || "",
        audience: body.audience || "ICP",
        pillar: body.pillar || "Contractor Realities",
        targetTrade: body.target_trade || body.targetTrade || "HVAC",
        status: body.status || "PENDING_REVIEW",
        claimsOk: body.claims_ok || body.claimsOk || "BLOCKED_PENDING_REVIEW",
        heroImageUrl: body.coverImageUrl || body.hero_image_url || body.heroImageUrl || null,
        linkedinVariant: typeof body.socialVariants?.linkedin === "string" ? body.socialVariants.linkedin : body.linkedin_variant || null,
        facebookVariant: typeof body.socialVariants?.facebook === "string" ? body.socialVariants.facebook : body.facebook_variant || null,
        xVariant: typeof body.socialVariants?.twitter === "string" ? body.socialVariants.twitter : body.x_variant || null,
        generationCost: body.totalCostUsd || body.generation_cost || 0.038,
        version: body.version || 1
      },
      create: {
        id: assetId,
        ideaId: body.ideaId || null,
        title: body.title || "Untitled Post",
        slug,
        hook: body.hook || "",
        coreArgument: body.core_argument || body.coreArgument || "",
        content: body.content || "",
        audience: body.audience || "ICP",
        pillar: body.pillar || "Contractor Realities",
        targetTrade: body.target_trade || body.targetTrade || "HVAC",
        status: "PENDING_REVIEW",
        claimsOk: "BLOCKED_PENDING_REVIEW",
        heroImageUrl: body.coverImageUrl || body.hero_image_url || body.heroImageUrl || null,
        linkedinVariant: typeof body.socialVariants?.linkedin === "string" ? body.socialVariants.linkedin : body.linkedin_variant || null,
        facebookVariant: typeof body.socialVariants?.facebook === "string" ? body.socialVariants.facebook : body.facebook_variant || null,
        xVariant: typeof body.socialVariants?.twitter === "string" ? body.socialVariants.twitter : body.x_variant || null,
        generationCost: body.totalCostUsd || body.generation_cost || 0.038,
        version: 1
      }
    });

    if (body.ideaId) {
      await prisma.idea.update({
        where: { id: body.ideaId },
        data: {
          draftAssetId: asset.id,
          status: "REVIEW",
          queueOrder: null,
          updatedAt: new Date()
        }
      }).catch((e) => console.warn(`Could not link idea ${body.ideaId}:`, e));
    }

    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
