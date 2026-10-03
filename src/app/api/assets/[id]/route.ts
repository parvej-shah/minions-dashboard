import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAssetDTO } from "@/lib/mappers/asset";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { getTenantBlogDomain } from "@/lib/tenantDomain";
import { parsePostChannels } from "@/constants/postChannels";
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
    return NextResponse.json(toAssetDTO(asset, null, await getTenantBlogDomain(ctx.clientId)));
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

    // A time is set only through /schedule, which checks it.
    if (body.status === "SCHEDULED") {
      return apiFailure("Use POST /api/assets/{id}/schedule to schedule a post", 400);
    }

    const owned = await prisma.asset.findFirst({
      where: { OR: [{ id }, { slug: id }], clientId: ctx.clientId },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!owned) {
      return apiFailure("Asset not found", 404);
    }

    // D18: where this one post goes. Fixed once it has gone out.
    let channels: string[] | undefined;
    if (body.channels !== undefined) {
      const parsed = body.channels === null ? [] : parsePostChannels(body.channels);
      if (parsed === null || (body.channels !== null && parsed.length === 0)) {
        return apiFailure("channels must name at least one of blog, linkedin, facebook (or be null for the workspace's)", 400);
      }
      if (owned.status === "PUBLISHED" || owned.publishedAt) {
        return apiFailure("This post has gone out, so its channels can't change", 409);
      }
      channels = parsed;
    }

    const updated = await prisma.asset.update({
      where: { id: owned.id },
      data: {
        ...(channels !== undefined && { channels }),
        ...(body.title !== undefined && { title: body.title }),
        ...(nextContent !== undefined && { content: nextContent }),
        ...(body.hook !== undefined && { hook: body.hook }),
        ...(body.core_argument !== undefined && { coreArgument: body.core_argument }),
        ...(body.status !== undefined && { status: body.status }),
        // Publishing now or sending it back to review replaces any scheduled time.
        ...((body.status === "PUBLISHED" || body.status === "PENDING_REVIEW") && { scheduledFor: null }),
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

    return NextResponse.json({
      success: true,
      asset: toAssetDTO(updated, null, await getTenantBlogDomain(ctx.clientId)),
    });
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
      await removeFromBlog(asset.id, asset.slug, asset.clientId);
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
      asset: toAssetDTO(updated, null, await getTenantBlogDomain(ctx.clientId)),
    });
  } catch (error) {
    return apiError(error, "Failed to delete or unpublish asset");
  }
}
