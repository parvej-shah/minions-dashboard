import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/lib/api-response";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { requireClientId } from "@/lib/tenant";
import { requireOneOfEnv } from "@/lib/env";
import { claimRunSlot } from "@/lib/harvestBudget";

/**
 * Triggers the live 02_idea_to_asset workflow in n8n.
 *
 * This route creates a PipelineRun row so the UI can track progress perfectly.
 * The workflow claims an idea, drafts it, runs the claims gate and syncs the 
 * finished asset into the `assets` table (roughly 150s later).
 *
 * The run row is claimed through `claimRunSlot`, which enforces the system-wide
 * daily ceiling. Drafting is the expensive half of the pipeline -- two writer
 * calls, a claims gate, social variants and a hero image -- so its budget is
 * deliberately tighter than the harvest one.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const ideaId = (body.idea_id as string | null) ?? null;

  if (ideaId) {
    const [idea, existingAsset] = await Promise.all([
      prisma.idea.findFirst({
        where: { id: ideaId, clientId: ctx.clientId },
        select: { id: true, draftAssetId: true, status: true },
      }),
      prisma.asset.findFirst({
        where: { ideaId, clientId: ctx.clientId },
        select: { id: true, title: true },
      }),
    ]);

    if (!idea) {
      return apiFailure(`Idea ${ideaId} does not exist.`, 404);
    }

    const assetId = existingAsset?.id ?? idea.draftAssetId;
    if (assetId) {
      return apiFailure(
        `This idea already has a draft (asset ${assetId}). Delete that asset first if you want to draft it again.`,
        409
      );
    }

    if (idea.status === "PICKED") {
      return apiFailure(
        "A drafting run already claimed this idea and is still working on it. Wait for it to finish, or reset the claim from the Idea Stream.",
        409
      );
    }
  }

  const slot = await claimRunSlot("DRAFT", ctx.clientId, {
    trigger_source: "MINIONS_COCKPIT_EDITORIAL",
    idea_id: ideaId,
  });

  if (!slot.granted) {
    return NextResponse.json(
      {
        success: false,
        message: `Daily drafting limit reached (${slot.budget.limit} runs across all tenants). The next window opens at 00:00 UTC.`,
        budget: slot.budget,
      },
      { status: 429 }
    );
  }

  const { result, status } = await triggerN8nWorkflow(
    "draft",
    {
      client_id: ctx.clientId,
      idea_id: ideaId,
      title: body.title ?? null,
      audience: body.audience ?? null,
      trade: body.target_trade ?? null,
      trigger_source: "MINIONS_COCKPIT_EDITORIAL",
      run_id: slot.runId,
      callback_url: `${requireOneOfEnv("NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL")}/api/pipeline/runs/${slot.runId}`
    },
    {
      failure:
        "The drafting pipeline did not accept the request. Check that 02_idea_to_asset is active in n8n",
      success:
        "Drafting run started. The finished draft appears in the Editorial Studio in about three minutes.",
    }
  );

  if (!result.success) {
    await prisma.pipelineRun.update({
      where: { id: slot.runId },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json(
    { ...result, requested_idea_id: ideaId, run_id: slot.runId, budget: slot.budget },
    { status }
  );
}
