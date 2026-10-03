import { NextResponse } from "next/server";
import { requireClientId } from "@/lib/tenant";
import { startHarvest } from "@/services/harvestRun";
import { apiError } from "@/server/http/respond";

/**
 * Triggers the live 01_idea_harvester workflow in n8n.
 *
 * This route creates a PipelineRun row so the UI can track progress perfectly.
 * The harvester writes its own rows and syncs them into the `ideas` table when 
 * the run finishes (roughly 90-120s later), and calls back to update the PipelineRun.
 *
 * The run row is claimed through `claimHarvestSlot`, which enforces the
 * system-wide daily ceiling. Manual triggers draw on the same budget as the
 * scheduled fan-out -- capping only the scheduler would leave this button as an
 * unmetered way around it.
 */
export async function POST() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { status, ...result } = await startHarvest(ctx.clientId, "MINIONS_COCKPIT_MANUAL");
    return NextResponse.json(result, { status });
  } catch (error) {
    return apiError(error, "Harvest trigger failed");
  }
}
