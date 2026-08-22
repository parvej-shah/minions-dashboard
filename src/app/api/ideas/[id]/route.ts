import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toIdeaDTO } from "@/lib/mappers/idea";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const idea = await prisma.idea.findFirst({ where: { id, clientId: ctx.clientId } });

    if (!idea) {
      return apiFailure("Idea not found", 404);
    }
    return NextResponse.json(toIdeaDTO(idea));
  } catch (error) {
    return apiError(error, "Failed to fetch idea");
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

    const owned = await prisma.idea.findFirst({
      where: { id, clientId: ctx.clientId },
      select: { draftAssetId: true },
    });
    if (!owned) {
      return apiFailure("Idea not found", 404);
    }

    // One idea -> one live asset. Re-queuing/re-harvesting an idea that already has a
    // draft would let the pipeline generate a second, orphaning asset for the same idea.
    // Only the asset DELETE endpoint (permanent mode) is allowed to clear draftAssetId.
    const wantsToBecomeAvailable =
      body.status !== undefined && ["QUEUED", "HARVESTED", "REFINED"].includes(body.status);
    if (wantsToBecomeAvailable && owned.draftAssetId) {
      return apiFailure(
        `This idea already has a draft (asset ${owned.draftAssetId}). Delete that asset first if you want to draft it again.`,
        409
      );
    }

    const updated = await prisma.idea.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { rawIdea: body.title }),
        ...(body.raw_idea !== undefined && { rawIdea: body.raw_idea }),
        ...(body.angle !== undefined && { angle: body.angle }),
        ...(body.excerpt !== undefined && { angle: body.excerpt }),
        ...(body.audience !== undefined && { audience: body.audience }),
        ...(body.target_trade !== undefined && { targetTrade: body.target_trade }),
        ...(body.trade !== undefined && { targetTrade: body.trade }),
        ...(body.pillar !== undefined && { pillar: body.pillar }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.scheduled_for !== undefined && {
          scheduledFor: body.scheduled_for ? new Date(body.scheduled_for) : null,
        }),
        ...(body.queue_order !== undefined && { queueOrder: body.queue_order }),
        ...(body.tags !== undefined && {
          tags: Array.isArray(body.tags) ? body.tags : [body.tags],
        }),
        ...(body.reset_claim && {
          claimedByRunId: null,
          claimedAt: null,
          status: "REFINED",
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, idea: toIdeaDTO(updated) });
  } catch (error) {
    return apiError(error, "Failed to update idea");
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

    const owned = await prisma.idea.findFirst({ where: { id, clientId: ctx.clientId } });
    if (!owned) {
      return apiFailure("Idea not found", 404);
    }

    // Decouple any assets that reference this idea to prevent foreign key errors,
    // then delete the idea itself.
    await prisma.asset.updateMany({ where: { ideaId: id }, data: { ideaId: null } });
    await prisma.idea.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return apiError(error, "Failed to delete idea");
  }
}
