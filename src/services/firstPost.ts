import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isPlaceholderTenantName } from "@/lib/tenant";
import { parseMemoryContent, parseMemoryKind } from "@/lib/authorInput";
import { blockingCodeFindings } from "@/lib/ai/memoryCheck";
import { sweepStaleRuns } from "@/lib/harvestBudget";
import { toAssetDTO } from "@/lib/mappers/asset";
import { getTenantBlogDomain } from "@/lib/tenantDomain";
import { MEMORY_KIND_SOURCE } from "@/constants/sourceMix";
import { FIRST_POST_TAG } from "@/constants/firstPost";
import { defaultByline } from "@/services/cover";
import { background } from "@/lib/background";
import { startDraftRun } from "@/services/drafting";
import { startStarterSet } from "@/services/starterSet";
import { createIdeaWithNextId } from "@/services/ideas";
import { type JsonObject } from "@/server/http/body";
import { badRequest, conflict, HttpError } from "@/server/http/errors";

const TRIGGER_SOURCE = "ONBOARDING_FIRST_POST";
const RECENT_RUNS_SCANNED = 20;

const findFirstPostIdea = (clientId: string) =>
  prisma.idea.findFirst({
    where: { clientId, tags: { has: FIRST_POST_TAG } },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, rawIdea: true },
  });

async function latestRunFor(clientId: string, ideaId: string) {
  const runs = await prisma.pipelineRun.findMany({
    where: { clientId, type: "DRAFT" },
    orderBy: { createdAt: "desc" },
    take: RECENT_RUNS_SCANNED,
    select: { id: true, status: true, metadata: true, createdAt: true },
  });
  return runs.find((run) => (run.metadata as Record<string, unknown> | null)?.idea_id === ideaId) ?? null;
}

function checkedStory(story: unknown): string {
  const content = parseMemoryContent(story);
  if (typeof content !== "string") throw badRequest(content.error);
  const blocked = blockingCodeFindings(content);
  if (blocked.length) throw badRequest(`Remove this first: ${blocked[0].reason}`);
  return content;
}

export function validateStory(story: unknown) {
  checkedStory(story);
  return { ok: true };
}

export async function getFirstPostState(clientId: string) {
  await sweepStaleRuns();
  const idea = await findFirstPostIdea(clientId);
  if (!idea) return { idea_id: null, story: null, run: null, asset: null };

  const [run, asset, domain, profile, session] = await Promise.all([
    latestRunFor(clientId, idea.id),
    prisma.asset.findFirst({ where: { clientId, ideaId: idea.id }, include: { claims: true } }),
    getTenantBlogDomain(clientId),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { brandName: true, coverByline: true, positioning: true } }),
    auth(),
  ]);

  const displayName = isPlaceholderTenantName(profile?.brandName) ? session?.user?.name?.trim() : profile?.brandName;
  return {
    idea_id: idea.id,
    story: idea.rawIdea,
    run: run ? { id: run.id, status: run.status, started_at: run.createdAt.toISOString() } : null,
    asset: asset ? toAssetDTO(asset, null, domain) : null,
    signoff: {
      name: displayName || profile?.brandName || "",
      role: profile?.coverByline?.trim() || defaultByline(profile?.positioning ?? "") || "",
    },
  };
}

async function createFirstPostIdea(clientId: string, body: JsonObject) {
  if (await prisma.asset.findFirst({ where: { clientId }, select: { id: true } })) {
    throw conflict("This workspace already has drafts. Find them in Editorial Studio.");
  }

  const kind = parseMemoryKind(body.kind) ?? "LESSON";
  const content = checkedStory(body.story);
  const memory = await prisma.professionalMemory.create({
    data: { clientId, kind, content, disclosure: "PUBLIC", source: "BRAND_PAGE" },
  });
  const created = await createIdeaWithNextId({
    clientId,
    rawIdea: content,
    source: "MANUAL",
    status: "REFINED",
    sourceType: MEMORY_KIND_SOURCE[kind].sourceType,
    trustBasis: ["LIVED_EXPERIENCE"],
    memoryIds: [memory.id],
    recommendedFormat: "POST",
    profileTarget: "PERSONAL",
    gateVerdict: "PASS",
    tags: [FIRST_POST_TAG],
  });
  if (!created) throw new HttpError(503, "Could not save your idea. Please try again.");
  return created;
}

async function releaseClaimBeforeRetry(idea: { id: string; status: string }) {
  if (idea.status === "PICKED") {
    await prisma.idea.update({ where: { id: idea.id }, data: { status: "REFINED", claimedByRunId: null, claimedAt: null } });
  }
}

export async function startFirstPost(clientId: string, body: JsonObject) {
  let idea = await findFirstPostIdea(clientId);

  if (!idea) {
    const created = await createFirstPostIdea(clientId, body);
    idea = { id: created.id, status: created.status, rawIdea: created.rawIdea };
  } else {
    const [run, asset] = await Promise.all([
      latestRunFor(clientId, idea.id),
      prisma.asset.findFirst({ where: { clientId, ideaId: idea.id }, select: { id: true } }),
    ]);
    if (asset || run?.status === "RUNNING") return { idea_id: idea.id, run_id: run?.id ?? null };
    await releaseClaimBeforeRetry(idea);
  }

  const run = await startDraftRun(clientId, idea.id, { triggerSource: TRIGGER_SOURCE });
  if (!run.result.success) throw new HttpError(502, "Drafting could not start right now. Please try again in a minute.");
  // Two more posts from other angles, after the response: the dashboard opens with three.
  const firstIdeaId = idea.id;
  background(() => startStarterSet(clientId, firstIdeaId));
  return { idea_id: idea.id, run_id: run.runId };
}
