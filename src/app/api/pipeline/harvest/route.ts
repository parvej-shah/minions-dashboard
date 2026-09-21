import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { requireClientId } from "@/lib/tenant";
import { requireOneOfEnv } from "@/lib/env";
import { claimHarvestSlot } from "@/lib/harvestBudget";
import { apiError } from "@/lib/api-response";

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
    const slot = await claimHarvestSlot(ctx.clientId, {
      trigger_source: "MINIONS_COCKPIT_MANUAL",
    });

    if (!slot.granted) {
      return NextResponse.json(
        {
          success: false,
          message: `Daily harvest limit reached (${slot.budget.limit} runs across all tenants). The next window opens at 00:00 UTC.`,
          budget: slot.budget,
        },
        { status: 429 }
      );
    }

    const { result, status } = await triggerN8nWorkflow(
      "harvest",
      {
        trigger_source: "MINIONS_COCKPIT_MANUAL",
        client_id: ctx.clientId,
        run_id: slot.runId,
        callback_url: `${requireOneOfEnv("NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL")}/api/pipeline/runs/${slot.runId}`
      },
      {
        failure: "The harvester did not accept the request. Check that 01_idea_harvester is active in n8n",
        success: "Harvester started. New ideas appear in the Idea Stream in about two minutes.",
      }
    );

    if (!result.success) {
      await prisma.pipelineRun.update({
        where: { id: slot.runId },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ ...result, run_id: slot.runId, budget: slot.budget }, { status });
  } catch (error) {
    return apiError(error, "Harvest trigger failed");
  }
}
