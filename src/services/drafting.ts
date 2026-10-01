import { prisma } from "@/lib/prisma";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { requireOneOfEnv } from "@/lib/env";
import { claimRunSlot } from "@/lib/harvestBudget";
import type { PipelineTriggerResult } from "@/types";

export type DraftRunResult =
  | { ok: true; status: number; result: PipelineTriggerResult; runId: string; budget: unknown }
  | { ok: false; status: number; error: string; budget?: unknown };

/**
 * Starts the live 02_idea_to_asset workflow in n8n for one workspace.
 *
 * A PipelineRun row is created so the UI can track progress. The workflow
 * claims an idea, drafts it, runs the claims gate and syncs the finished asset
 * into the `assets` table (roughly 150s later).
 *
 * The run row is claimed through `claimRunSlot`, which enforces the system-wide
 * daily ceiling. Drafting is the expensive half of the pipeline -- two writer
 * calls, a claims gate, social variants and a hero image -- so its budget is
 * deliberately tighter than the harvest one.
 */
export async function startDraftRun(
  clientId: string,
  ideaId: string | null,
  extra: { title?: unknown; audience?: unknown; target_trade?: unknown; triggerSource?: string } = {}
): Promise<DraftRunResult> {
  const triggerSource = extra.triggerSource ?? "MINIONS_COCKPIT_EDITORIAL";

  if (ideaId) {
    const [idea, existingAsset] = await Promise.all([
      prisma.idea.findFirst({
        where: { id: ideaId, clientId },
        select: { id: true, draftAssetId: true, status: true },
      }),
      prisma.asset.findFirst({
        where: { ideaId, clientId },
        select: { id: true, title: true },
      }),
    ]);

    if (!idea) return { ok: false, status: 404, error: `Idea ${ideaId} does not exist.` };

    const assetId = existingAsset?.id ?? idea.draftAssetId;
    if (assetId) {
      return {
        ok: false,
        status: 409,
        error: `This idea already has a draft (asset ${assetId}). Delete that asset first if you want to draft it again.`,
      };
    }

    if (idea.status === "PICKED") {
      return {
        ok: false,
        status: 409,
        error:
          "A drafting run already claimed this idea and is still working on it. Wait for it to finish, or reset the claim from the Idea Stream.",
      };
    }
  }

  const slot = await claimRunSlot("DRAFT", clientId, { trigger_source: triggerSource, idea_id: ideaId });
  if (!slot.granted) {
    return {
      ok: false,
      status: 429,
      error: `Daily drafting limit reached (${slot.budget.limit} runs across all tenants). The next window opens at 00:00 UTC.`,
      budget: slot.budget,
    };
  }

  const { result, status } = await triggerN8nWorkflow(
    "draft",
    {
      client_id: clientId,
      idea_id: ideaId,
      title: extra.title ?? null,
      audience: extra.audience ?? null,
      trade: extra.target_trade ?? null,
      trigger_source: triggerSource,
      run_id: slot.runId,
      callback_url: `${requireOneOfEnv("NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL")}/api/pipeline/runs/${slot.runId}`,
    },
    {
      failure: "The drafting pipeline did not accept the request. Check that 02_idea_to_asset is active in n8n",
      success: "Drafting run started. The finished draft appears in the Editorial Studio in about a minute.",
    }
  );

  if (!result.success) {
    await prisma.pipelineRun.update({ where: { id: slot.runId }, data: { status: "FAILED" } });
  }

  return { ok: true, status, result, runId: slot.runId, budget: slot.budget };
}
