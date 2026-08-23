import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { requireClientId } from "@/lib/tenant";

/**
 * Triggers the live 01_idea_harvester workflow in n8n.
 *
 * This route creates a PipelineRun row so the UI can track progress perfectly.
 * The harvester writes its own rows and syncs them into the `ideas` table when 
 * the run finishes (roughly 90-120s later), and calls back to update the PipelineRun.
 */
export async function POST() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const run = await prisma.pipelineRun.create({
    data: {
      clientId: ctx.clientId,
      type: "HARVEST",
      status: "RUNNING",
    },
  });

  const { result, status } = await triggerN8nWorkflow(
    "harvest",
    { 
      trigger_source: "MINIONS_COCKPIT_MANUAL",
      client_id: ctx.clientId,
      run_id: run.id,
      callback_url: `${process.env.NEXTAUTH_URL}/api/pipeline/runs/${run.id}`
    },
    {
      failure: "The harvester did not accept the request. Check that 01_idea_harvester is active in n8n",
      success: "Harvester started. New ideas appear in the Idea Stream in about two minutes.",
    }
  );

  if (!result.success) {
    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ ...result, run_id: run.id }, { status });
}
