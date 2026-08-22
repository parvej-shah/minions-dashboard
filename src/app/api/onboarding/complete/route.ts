import { NextResponse } from "next/server";
import { apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { triggerN8nWorkflow } from "@/services/pipeline";

/**
 * Final onboarding step: triggers the harvester for this tenant so their
 * first ideas start showing up in Idea Stream without waiting for the
 * next scheduled harvest run. Uses 01_idea_harvester's test webhook, the
 * same path 00_tenant_dispatcher will call once it's activated.
 */
export async function POST() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const { result, status } = await triggerN8nWorkflow(
    "harvest",
    { client_id: ctx.clientId, trigger_source: "ONBOARDING_COMPLETE" },
    {
      failure: "Onboarding is saved, but the first harvest run didn't start automatically",
      success: "Your first ideas are on the way. This can take a minute or two.",
    }
  );

  if (status !== 200) return apiFailure(result.message, status);
  return NextResponse.json(result);
}
