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

    // IDEA-#### ids are global, not per-tenant, so the highest number has to be
    // read across every tenant. Reading it and inserting in two steps races: two
    // injects landing together compute the same number and the second dies on a
    // primary-key collision, which surfaced as "I saved my idea and it vanished".
    // Retry on that collision rather than widening this into a table lock -- the
    // window is tiny and a handful of attempts closes it.
    let created = null;
    for (let attempt = 0; attempt < 5 && created === null; attempt++) {
      const highest = await prisma.idea.findFirst({
        orderBy: { id: "desc" },
        select: { id: true },
      });
      const parsed = Number.parseInt((highest?.id ?? "").replace(/\D/g, ""), 10);
      const nextNumber = (Number.isFinite(parsed) ? parsed : 0) + 1 + attempt;

      try {
        created = await prisma.idea.create({
          data: {
            id: `IDEA-${String(nextNumber).padStart(4, "0")}`,
            clientId: ctx.clientId,
            rawIdea: body.raw_idea ?? body.title ?? "Untitled idea",
            angle: body.angle ?? null,
            audience: body.audience ?? "ICP",
            targetTrade: body.target_trade ?? "",
            // "Contractor Realities" is a home-services pillar that every tenant
            // inherited regardless of industry. Leave it unset instead of
            // stamping another vertical's vocabulary onto the row.
            pillar: body.pillar ?? "",
            source: body.source ?? "MANUAL",
            sourceUrl: body.source_url ?? null,
            sourceTitle: body.source_title ?? null,
            signals: Array.isArray(body.signals)
              ? body.signals
              : body.signals
                ? [body.signals]
                : [],
            // REFINED, not HARVESTED: REFINED is what the pipeline writes for a
            // ready-to-draft idea, and the Idea Stream groups on that.
            status: body.status ?? "REFINED",
            why: body.why ?? null,
            tags: Array.isArray(body.tags) ? body.tags : [],
          },
        });
      } catch (err) {
        const isIdCollision =
          typeof err === "object" &&
          err !== null &&
          (err as { code?: string }).code === "P2002";
        if (!isIdCollision) throw err;
      }
    }

    if (!created) {
      return apiFailure("Could not allocate an idea id. Please try again.", 503);
    }

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
