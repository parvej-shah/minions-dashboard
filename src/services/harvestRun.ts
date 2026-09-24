import { prisma } from "@/lib/prisma";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { requireOneOfEnv } from "@/lib/env";
import { claimHarvestSlot } from "@/lib/harvestBudget";

export interface HarvestStart {
  success: boolean;
  message: string;
  status: number;
  run_id?: string;
  budget?: unknown;
}

/**
 * Starts one 01_idea_harvester run for a tenant: the Idea Stream's button and
 * the weekly question's "ideas from this now" (phase 6) both come here.
 *
 * The run row is claimed through `claimHarvestSlot`, which enforces the
 * system-wide daily ceiling, so every trigger draws on the same budget as the
 * scheduled fan-out.
 */
export async function startHarvest(clientId: string, triggerSource: string): Promise<HarvestStart> {
  const slot = await claimHarvestSlot(clientId, { trigger_source: triggerSource });
  if (!slot.granted) {
    return {
      success: false,
      status: 429,
      message: `Daily harvest limit reached (${slot.budget.limit} runs across all tenants). The next window opens at 00:00 UTC.`,
      budget: slot.budget,
    };
  }

  const { result, status } = await triggerN8nWorkflow(
    "harvest",
    {
      trigger_source: triggerSource,
      client_id: clientId,
      run_id: slot.runId,
      callback_url: `${requireOneOfEnv("NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL")}/api/pipeline/runs/${slot.runId}`,
    },
    {
      failure: "The harvester did not accept the request. Check that 01_idea_harvester is active in n8n",
      success: "Harvester started. New ideas appear in the Idea Stream in about two minutes.",
    }
  );

  if (!result.success) {
    await prisma.pipelineRun.update({ where: { id: slot.runId }, data: { status: "FAILED" } });
  }
  return { ...result, status, run_id: slot.runId, budget: slot.budget };
}
