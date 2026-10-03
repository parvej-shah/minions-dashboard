import { dispatchRun } from "@/services/pipeline";
import { claimHarvestSlot } from "@/lib/harvestBudget";

export interface HarvestStart {
  success: boolean;
  message: string;
  status: number;
  run_id?: string;
  budget?: unknown;
}

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

  const { result, status } = await dispatchRun(
    "harvest",
    slot.runId,
    { trigger_source: triggerSource, client_id: clientId },
    {
      failure: "The harvester did not accept the request. Check that 01_idea_harvester is active in n8n",
      success: "Harvester started. New ideas appear in the Idea Stream in about two minutes.",
    }
  );
  return { ...result, status, run_id: slot.runId, budget: slot.budget };
}
