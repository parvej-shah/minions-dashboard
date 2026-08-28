import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toIdeaDTO } from "@/lib/mappers/idea";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const ideas = await prisma.idea.findMany({
      where: { clientId: ctx.clientId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(ideas.map(toIdeaDTO));
  } catch (error) {
    return apiError(error, "Failed to fetch ideas");
  }
}

export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();

    const existingIds = await prisma.idea.findMany({
      select: { id: true },
    });
    const nextNumber =
      existingIds.reduce((max, row) => {
        const parsed = Number.parseInt(row.id.replace(/\D/g, ""), 10);
        return Number.isFinite(parsed) && parsed > max ? parsed : max;
      }, 0) + 1;

    const created = await prisma.idea.create({
      data: {
        id: `IDEA-${String(nextNumber).padStart(4, "0")}`,
        clientId: ctx.clientId,
        rawIdea: body.raw_idea ?? body.title ?? "Untitled idea",
        angle: body.angle ?? null,
        audience: body.audience ?? "ICP",
        targetTrade: body.target_trade ?? "",
        pillar: body.pillar ?? "Contractor Realities",
        source: body.source ?? "MANUAL",
        sourceUrl: body.source_url ?? null,
        sourceTitle: body.source_title ?? null,
        signals: Array.isArray(body.signals) ? body.signals : (body.signals ? [body.signals] : []),
        status: body.status ?? "HARVESTED",
        why: body.why ?? null,
        tags: Array.isArray(body.tags) ? body.tags : [],
      },
    });

    return NextResponse.json(toIdeaDTO(created), { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create idea");
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();

    if (!Array.isArray(body.queueItems)) {
      return apiFailure("Invalid payload: expected a queueItems array", 400);
    }

    const ids: string[] = body.queueItems.map((item: { id: string }) => item.id);
    const alreadyDrafted = await prisma.idea.findMany({
      where: { id: { in: ids }, clientId: ctx.clientId, NOT: { draftAssetId: null } },
      select: { id: true },
    });

    if (alreadyDrafted.length > 0) {
      return apiFailure(
        `Cannot re-queue ideas that already have a draft: ${alreadyDrafted
          .map((i) => i.id)
          .join(", ")}`,
        409
      );
    }

    await prisma.$transaction(
      body.queueItems.map((item: { id: string; queue_order: number; scheduled_for?: string }) =>
        prisma.idea.updateMany({
          where: { id: item.id, clientId: ctx.clientId },
          data: {
            queueOrder: item.queue_order,
            status: "QUEUED",
            ...(item.scheduled_for ? { scheduledFor: new Date(item.scheduled_for) } : {}),
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: body.queueItems.length });
  } catch (error) {
    return apiError(error, "Failed to update idea queue");
  }
}
