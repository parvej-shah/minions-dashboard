import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { requireOneOfEnv } from "@/lib/env";

/**
 * Final onboarding step: triggers the harvester for this tenant so their
 * first ideas start showing up in Idea Stream without waiting for the
 * next scheduled harvest run. Uses 01_idea_harvester's test webhook, the
 * same path 00_tenant_dispatcher will call once it's activated.
 *
 * Creates a PipelineRun + callback_url, mirroring /api/pipeline/harvest,
 * so the done page can poll real status instead of showing a canned
 * message with no feedback -- see GET /api/pipeline/runs/[id].
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
      client_id: ctx.clientId,
      trigger_source: "ONBOARDING_COMPLETE",
      run_id: run.id,
      callback_url: `${requireOneOfEnv("NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL")}/api/pipeline/runs/${run.id}`,
    },
    {
      failure: "Onboarding is saved, but the first harvest run didn't start automatically",
      success: "Your first ideas are on the way. This can take a minute or two.",
    }
  );

  if (!result.success) {
    await prisma.pipelineRun.update({ where: { id: run.id }, data: { status: "FAILED" } });
  }

  if (status !== 200) return apiFailure(result.message, status);
  return NextResponse.json({ ...result, run_id: run.id });
}
