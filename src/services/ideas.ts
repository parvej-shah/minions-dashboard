import type { Idea, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveTopics } from "@/constants/topics";
import { ideaDTOSelect, toIdeaDTO } from "@/lib/mappers/idea";
import type { JsonObject } from "@/server/http/body";
import { asList } from "@/server/http/body";
import { conflict, HttpError, notFound } from "@/server/http/errors";

const ID_ALLOCATION_ATTEMPTS = 5;
const PRISMA_UNIQUE_VIOLATION = "P2002";
const REQUEUEABLE_STATUSES = ["QUEUED", "HARVESTED", "REFINED"];

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: string }).code === PRISMA_UNIQUE_VIOLATION;

// IDEA-#### ids are global across tenants, so concurrent inserts can compute the same number;
// retrying on the unique violation closes the race without a table lock.
export async function createIdeaWithNextId(data: Omit<Prisma.IdeaUncheckedCreateInput, "id">): Promise<Idea | null> {
  for (let attempt = 0; attempt < ID_ALLOCATION_ATTEMPTS; attempt++) {
    const highest = await prisma.idea.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const parsed = Number.parseInt((highest?.id ?? "").replace(/\D/g, ""), 10);
    const nextNumber = (Number.isFinite(parsed) ? parsed : 0) + 1 + attempt;
    try {
      return await prisma.idea.create({ data: { ...data, id: `IDEA-${String(nextNumber).padStart(4, "0")}` } });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return null;
}

const PUBLISHED_ASSET: Prisma.AssetWhereInput = {
  OR: [{ status: "PUBLISHED" }, { publishedAt: { not: null } }, { linkedinPublishedAt: { not: null } }, { facebookPublishedAt: { not: null } }],
};

/**
 * The publisher marks the draft published and never touches its idea, which
 * stays at REVIEW. An idea whose draft went out reads as published here, so the
 * Idea Stream agrees with Published Posts without n8n writing the idea row.
 */
export async function listIdeas(clientId: string) {
  const ideas = await prisma.idea.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: { ...ideaDTOSelect, assets: { where: PUBLISHED_ASSET, select: { id: true }, take: 1 } },
  });
  return ideas.map(({ assets, ...idea }) => toIdeaDTO(assets.length > 0 ? { ...idea, status: "PUBLISHED" } : idea));
}

async function findOwnedIdea(clientId: string, id: string) {
  const idea = await prisma.idea.findFirst({ where: { id, clientId } });
  if (!idea) throw notFound("Idea not found");
  return idea;
}

export async function getIdea(clientId: string, id: string) {
  return toIdeaDTO(await findOwnedIdea(clientId, id));
}

export async function createIdea(clientId: string, body: JsonObject) {
  const created = await createIdeaWithNextId({
    clientId,
    rawIdea: (body.raw_idea ?? body.title ?? "Untitled idea") as string,
    angle: (body.angle ?? null) as string | null,
    audience: (body.audience ?? "ICP") as string,
    targetTrade: (body.target_trade ?? "") as string,
    pillar: (body.pillar ?? "") as string,
    source: (body.source ?? "MANUAL") as string,
    sourceUrl: (body.source_url ?? null) as string | null,
    sourceTitle: (body.source_title ?? null) as string | null,
    signals: asList(body.signals) as Prisma.InputJsonValue[],
    status: (body.status ?? "REFINED") as string,
    why: (body.why ?? null) as string | null,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
  });
  if (!created) throw new HttpError(503, "Could not allocate an idea id. Please try again.");
  return toIdeaDTO(created);
}

export async function queueIdeas(
  clientId: string,
  items: { id: string; queue_order: number; scheduled_for?: string }[]
) {
  const alreadyDrafted = await prisma.idea.findMany({
    where: { id: { in: items.map((item) => item.id) }, clientId, NOT: { draftAssetId: null } },
    select: { id: true },
  });
  if (alreadyDrafted.length > 0) {
    throw conflict(`Cannot re-queue ideas that already have a draft: ${alreadyDrafted.map((idea) => idea.id).join(", ")}`);
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.idea.updateMany({
        where: { id: item.id, clientId },
        data: {
          queueOrder: item.queue_order,
          status: "QUEUED",
          ...(item.scheduled_for ? { scheduledFor: new Date(item.scheduled_for) } : {}),
        },
      })
    )
  );
  return items.length;
}

function ideaUpdateData(body: JsonObject): Prisma.IdeaUncheckedUpdateInput {
  const has = (key: string) => body[key] !== undefined;
  return {
    ...(has("title") && { rawIdea: body.title as string }),
    ...(has("raw_idea") && { rawIdea: body.raw_idea as string }),
    ...(has("angle") && { angle: body.angle as string }),
    ...(has("excerpt") && { angle: body.excerpt as string }),
    ...(has("audience") && { audience: body.audience as string }),
    ...(has("target_trade") && { targetTrade: body.target_trade as string }),
    ...(has("pillar") && { pillar: body.pillar as string }),
    ...(has("source") && { source: body.source as string }),
    ...(has("source_url") && { sourceUrl: body.source_url as string }),
    ...(has("source_title") && { sourceTitle: body.source_title as string }),
    ...(has("signals") && { signals: asList(body.signals) as Prisma.InputJsonValue[] }),
    ...(has("priority") && { priority: body.priority as string }),
    ...(has("status") && { status: body.status as string }),
    ...(has("scheduled_for") && { scheduledFor: body.scheduled_for ? new Date(body.scheduled_for as string) : null }),
    ...(has("queue_order") && { queueOrder: body.queue_order as number }),
    ...(has("tags") && { tags: (Array.isArray(body.tags) ? body.tags : [body.tags]) as string[] }),
    ...(body.reset_claim ? { claimedByRunId: null, claimedAt: null, status: "REFINED" } : {}),
    updatedAt: new Date(),
  };
}

export async function updateIdea(clientId: string, id: string, body: JsonObject) {
  const owned = await findOwnedIdea(clientId, id);
  // One idea, one live asset: only the asset DELETE endpoint may clear draftAssetId.
  const becomesAvailable = typeof body.status === "string" && REQUEUEABLE_STATUSES.includes(body.status);
  if (becomesAvailable && owned.draftAssetId) {
    throw conflict(
      `This idea already has a draft (asset ${owned.draftAssetId}). Delete that asset first if you want to draft it again.`
    );
  }
  const updated = await prisma.idea.update({ where: { id }, data: ideaUpdateData(body) });
  return toIdeaDTO(updated);
}

export async function deleteIdea(clientId: string, id: string) {
  await findOwnedIdea(clientId, id);
  await prisma.asset.updateMany({ where: { ideaId: id }, data: { ideaId: null } });
  await prisma.idea.delete({ where: { id } });
}

export async function listTopics(clientId: string) {
  const [themes, used] = await Promise.all([
    prisma.brandDirective.findFirst({
      where: { clientId, ruleKey: "core_themes", isActive: true },
      select: { instruction: true },
    }),
    prisma.idea.findMany({
      where: { clientId, NOT: { targetTrade: "" } },
      select: { targetTrade: true },
      distinct: ["targetTrade"],
    }),
  ]);
  return resolveTopics(themes?.instruction, used.map((row) => row.targetTrade));
}
