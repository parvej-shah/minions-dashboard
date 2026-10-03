import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { getCurrentUser, isPlaceholderTenantName, requireClientId } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { defaultByline } from "@/services/cover";
import { parseMemoryContent, parseMemoryKind } from "@/lib/authorInput";
import { blockingCodeFindings } from "@/lib/ai/memoryCheck";
import { MEMORY_KIND_SOURCE } from "@/constants/sourceMix";
import { FIRST_POST_TAG } from "@/constants/firstPost";
import { sweepStaleRuns } from "@/lib/harvestBudget";
import { toAssetDTO } from "@/lib/mappers/asset";
import { getTenantBlogDomain } from "@/lib/tenantDomain";
import { createIdeaWithNextId } from "@/services/ideas";
import { startDraftRun } from "@/services/drafting";

/**
 * The first post, written during setup from one thing the author tells us.
 *
 * POST saves the answer as an experience item (so later drafts can use it
 * too), builds an idea on it and starts the real drafting pipeline. GET
 * reports where that draft is, for the waiting and reveal screen.
 */

const TRIGGER_SOURCE = "ONBOARDING_FIRST_POST";

async function findFirstPostIdea(clientId: string) {
  return prisma.idea.findFirst({
    where: { clientId, tags: { has: FIRST_POST_TAG } },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, rawIdea: true },
  });
}

async function latestRunFor(clientId: string, ideaId: string) {
  const runs = await prisma.pipelineRun.findMany({
    where: { clientId, type: "DRAFT" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, metadata: true, createdAt: true },
  });
  return runs.find((r) => (r.metadata as Record<string, unknown> | null)?.idea_id === ideaId) ?? null;
}

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    await sweepStaleRuns();
    const idea = await findFirstPostIdea(ctx.clientId);
    if (!idea) return NextResponse.json({ idea_id: null, story: null, run: null, asset: null });

    const [run, asset, domain, profile, session] = await Promise.all([
      latestRunFor(ctx.clientId, idea.id),
      prisma.asset.findFirst({ where: { clientId: ctx.clientId, ideaId: idea.id }, include: { claims: true } }),
      getTenantBlogDomain(ctx.clientId),
      prisma.brandProfile.findUnique({ where: { clientId: ctx.clientId }, select: { brandName: true, coverByline: true, positioning: true } }),
      auth(),
    ]);
    // The cover's author line as drawn, for setup's last question.
    const signoff = {
      name: (isPlaceholderTenantName(profile?.brandName) ? session?.user?.name?.trim() : profile?.brandName) || profile?.brandName || "",
      role: profile?.coverByline?.trim() || defaultByline(profile?.positioning ?? "") || "",
    };

    return NextResponse.json({
      idea_id: idea.id,
      story: idea.rawIdea,
      run: run ? { id: run.id, status: run.status, started_at: run.createdAt.toISOString() } : null,
      asset: asset ? toAssetDTO(asset, null, domain) : null,
      signoff,
    });
  } catch (error) {
    return apiError(error, "Could not check on your first post");
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  // Setup checks the answer before it saves the workspace, so a story that
  // would be refused never leaves a half-finished setup behind. A new user
  // has no workspace yet here, so this only needs a signed-in user.
  if (body?.validate === true) {
    if (!(await getCurrentUser())) return apiFailure("Unauthorized", 401);
    const content = parseMemoryContent(body.story);
    if (typeof content !== "string") return apiFailure(content.error, 400);
    const blocked = blockingCodeFindings(content);
    if (blocked.length) return apiFailure(`Remove this first: ${blocked[0].reason}`, 400);
    return NextResponse.json({ ok: true });
  }

  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {

    let idea = await findFirstPostIdea(ctx.clientId);

    if (!idea) {
      // A workspace that already has drafts is past its first post.
      if (await prisma.asset.findFirst({ where: { clientId: ctx.clientId }, select: { id: true } })) {
        return apiFailure("This workspace already has drafts. Find them in Editorial Studio.", 409);
      }

      const kind = parseMemoryKind(body?.kind) ?? "LESSON";
      const content = parseMemoryContent(body?.story);
      if (typeof content !== "string") return apiFailure(content.error, 400);
      // Confidential material is never stored (decision D4).
      const blocked = blockingCodeFindings(content);
      if (blocked.length) return apiFailure(`Remove this first: ${blocked[0].reason}`, 400);

      const memory = await prisma.professionalMemory.create({
        data: { clientId: ctx.clientId, kind, content, disclosure: "PUBLIC", source: "BRAND_PAGE" },
      });
      const created = await createIdeaWithNextId({
        clientId: ctx.clientId,
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
      if (!created) return apiFailure("Could not save your idea. Please try again.", 503);
      idea = { id: created.id, status: created.status, rawIdea: created.rawIdea };
    } else {
      // Retrying: only when the last run is over and left no draft behind.
      const [run, asset] = await Promise.all([
        latestRunFor(ctx.clientId, idea.id),
        prisma.asset.findFirst({ where: { clientId: ctx.clientId, ideaId: idea.id }, select: { id: true } }),
      ]);
      if (asset || run?.status === "RUNNING") {
        return NextResponse.json({ idea_id: idea.id, run_id: run?.id ?? null });
      }
      // A failed run can leave its claim behind; release it so the retry can draft.
      if (idea.status === "PICKED") {
        await prisma.idea.update({ where: { id: idea.id }, data: { status: "REFINED", claimedByRunId: null, claimedAt: null } });
      }
    }

    const run = await startDraftRun(ctx.clientId, idea.id, { triggerSource: TRIGGER_SOURCE });
    if (!run.ok) return apiFailure(run.error, run.status);
    if (!run.result.success) return apiFailure("Drafting could not start right now. Please try again in a minute.", 502);
    return NextResponse.json({ idea_id: idea.id, run_id: run.runId });
  } catch (error) {
    return apiError(error, "Could not start your first post");
  }
}
