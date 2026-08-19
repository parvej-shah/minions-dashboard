import { NextResponse } from "next/server";
import { triggerN8nWorkflow } from "@/services/pipeline";

/**
 * Triggers the live 01_idea_harvester workflow in n8n.
 *
 * This route does NOT create ideas itself. The harvester writes its own rows and
 * syncs them into the `ideas` table when the run finishes (roughly 90-120s later),
 * so the caller should poll /api/ideas rather than expect ideas in this response.
 */
export async function POST() {
  const { result, status } = await triggerN8nWorkflow(
    "harvest",
    { trigger_source: "MINIONS_COCKPIT_MANUAL" },
    {
      failure: "The harvester did not accept the request. Check that 01_idea_harvester is active in n8n",
      success: "Harvester started. New ideas appear in the Idea Stream in about two minutes.",
    }
  );
  return NextResponse.json(result, { status });
}
