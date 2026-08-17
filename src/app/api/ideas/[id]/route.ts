import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        assets: true,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: idea.id,
      title: idea.rawIdea,
      raw_idea: idea.rawIdea,
      angle: idea.angle || "",
      excerpt: idea.angle || idea.why || "",
      audience: idea.audience,
      target_trade: idea.targetTrade,
      pillar: idea.pillar,
      source: idea.source,
      status: idea.status,
      priority: idea.priority,
      tags: idea.tags,
      draft_asset_id: idea.draftAssetId,
      scheduled_for: idea.scheduledFor ? idea.scheduledFor.toISOString() : null,
      queue_order: idea.queueOrder,
      created_at: idea.createdAt.toISOString(),
      updated_at: idea.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching idea by ID:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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
        ...(body.tags !== undefined && { tags: Array.isArray(body.tags) ? body.tags : [body.tags] }),
        ...(body.reset_claim && {
          claimedByRunId: null,
          claimedAt: null,
          status: "REFINED",
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      idea: {
        id: updated.id,
        title: updated.rawIdea,
        raw_idea: updated.rawIdea,
        angle: updated.angle || "",
        excerpt: updated.angle || "",
        audience: updated.audience,
        target_trade: updated.targetTrade,
        pillar: updated.pillar,
        source: updated.source,
        status: updated.status,
        priority: updated.priority,
        tags: updated.tags,
        scheduled_for: updated.scheduledFor ? updated.scheduledFor.toISOString() : null,
        queue_order: updated.queueOrder,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error updating idea:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Decouple any assets that reference this idea to prevent foreign key errors
    await prisma.asset.updateMany({
      where: { ideaId: id },
      data: { ideaId: null },
    });

    // 2. Delete the idea safely
    await prisma.idea.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Idea ${id} deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Error deleting idea:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
