import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAssetDTO } from "@/lib/mappers/asset";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import {
  releaseIdeaForRedraft,
  removeFromBlog,
  syncAssetToBlog,
  type BlogEditFields,
} from "@/services/publishing";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { slug: id }], clientId: ctx.clientId },
      include: { claims: true },
    });

    if (!asset) {
      return apiFailure("Asset not found", 404);
    }
    return NextResponse.json(toAssetDTO(asset));
  } catch (error) {
    return apiError(error, "Failed to fetch asset");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const nextContent = body.content ?? body.body_content;

    const owned = await prisma.asset.findFirst({
      where: { OR: [{ id }, { slug: id }], clientId: ctx.clientId },
      select: { id: true },
    });
    if (!owned) {
      return apiFailure("Asset not found", 404);
    }

    const updated = await prisma.asset.update({
      where: { id: owned.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(nextContent !== undefined && { content: nextContent }),
        ...(body.hook !== undefined && { hook: body.hook }),
        ...(body.core_argument !== undefined && { coreArgument: body.core_argument }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.claims_ok !== undefined && { claimsOk: body.claims_ok }),
        ...(body.published_at !== undefined && { publishedAt: body.published_at ? new Date(body.published_at) : null }),
        ...(body.published_urls !== undefined && {
          publishedUrls: Array.isArray(body.published_urls)
            ? body.published_urls.join(",")
            : body.published_urls,
        }),
        ...(body.linkedin_variant !== undefined && { linkedinVariant: body.linkedin_variant }),
        ...(body.facebook_variant !== undefined && { facebookVariant: body.facebook_variant }),
        ...(body.x_variant !== undefined && { xVariant: body.x_variant }),
        ...(body.variants?.linkedin !== undefined && { linkedinVariant: body.variants.linkedin }),
        ...(body.variants?.facebook !== undefined && { facebookVariant: body.variants.facebook }),
        ...(body.variants?.twitter !== undefined && { xVariant: body.variants.twitter }),
        updatedAt: new Date(),
      },
      include: { claims: true },
    });

    const edits: BlogEditFields = {
      ...(body.title !== undefined && { title: body.title }),
      ...(nextContent !== undefined && { content: nextContent }),
      ...(body.hook !== undefined && { hook: body.hook }),
      ...(body.core_argument !== undefined && { coreArgument: body.core_argument }),
    };
    await syncAssetToBlog(updated, body.status, edits);

    return NextResponse.json({ success: true, asset: toAssetDTO(updated) });
  } catch (error) {
    return apiError(error, "Failed to update asset");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const mode = new URL(request.url).searchParams.get("mode") ?? "unpublish";

    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { slug: id }], clientId: ctx.clientId },
    });
    if (!asset) {
      return apiFailure("Asset not found", 404);
    }

    // Take it down from the public blog first, in both modes. A mirror failure
    // must not block the delete, so it is logged rather than propagated.
    try {
      await removeFromBlog(asset.id, asset.slug);
    } catch (blogError) {
      console.warn("[assets] Could not delete from blogs table:", blogError);
    }

    if (mode === "permanent") {
      if (asset.ideaId) {
        await releaseIdeaForRedraft(asset.ideaId);
      }
      await prisma.claim.deleteMany({ where: { assetId: asset.id } });
      await prisma.asset.delete({ where: { id: asset.id } });
      return NextResponse.json({
        success: true,
        message: "Asset and live blog permanently deleted",
      });
    }

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: {
        status: "PENDING_REVIEW",
        publishedAt: null,
        publishedUrls: null,
        updatedAt: new Date(),
      },
      include: { claims: true },
    });

    return NextResponse.json({
      success: true,
      message: "Blog unpublished and reverted to review queue",
      asset: toAssetDTO(updated),
    });
  } catch (error) {
    return apiError(error, "Failed to delete or unpublish asset");
  }
}
