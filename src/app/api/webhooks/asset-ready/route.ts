import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSecret } from "@/lib/security";

export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const assetId = body.assetId || body.id || `ASSET-${Date.now()}`;
    const slug = body.slug || (body.title || "untitled-post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    // One idea -> one asset. If this idea already produced one, the run is
    // either a retry or a lost claim race, and the existing asset is updated in
    // place. Creating a second row here would put two articles for the same idea
    // into the review queue, which is what happened to IDEA-0010 and IDEA-0038.
    const ideaId = body.ideaId || body.idea_id || null;
    const existingForIdea = ideaId
      ? await prisma.asset.findFirst({ where: { ideaId }, select: { id: true } })
      : null;

    if (existingForIdea && existingForIdea.id !== assetId) {
      console.warn(
        `[asset-ready] idea ${ideaId} already has asset ${existingForIdea.id}; ` +
          `updating it in place instead of creating ${assetId}`
      );
    }

    const targetId = existingForIdea?.id ?? assetId;

    const asset = await prisma.asset.upsert({
      where: { id: targetId },
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
        id: targetId,
        ideaId,
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

    if (ideaId) {
      await prisma.idea.update({
        where: { id: ideaId },
        data: {
          draftAssetId: asset.id,
          status: "REVIEW",
          queueOrder: null,
          updatedAt: new Date()
        }
      }).catch((e) => console.warn(`Could not link idea ${ideaId}:`, e));
    }

    return NextResponse.json(
      {
        success: true,
        asset,
        // Tells the caller its new id was ignored, rather than silently
        // returning a row it did not expect.
        duplicate_prevented: Boolean(existingForIdea && existingForIdea.id !== assetId),
      },
      { status: existingForIdea ? 200 : 201 }
    );
  } catch (error) {
    return apiError(error, "Webhook processing failed");
  }
}
