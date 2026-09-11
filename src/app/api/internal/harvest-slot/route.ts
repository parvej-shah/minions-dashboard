import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { claimHarvestSlot, getHarvestBudget } from "@/lib/harvestBudget";

/**
 * Reserves one unit of the system-wide daily harvest budget on behalf of
 * 00_tenant_dispatcher.
 *
 * The dispatcher fans out one harvest per ACTIVE tenant, so the cost of a day's
 * harvesting scales with tenant count and nothing in n8n can see the total --
 * `Backlog Guard` inside 01_idea_harvester only knows about the tenant it is
 * running for. This endpoint is the one place that can count across all of them.
 *
 * A 429 here is a normal outcome, not a fault: the dispatcher treats it as
 * "skip this tenant today" rather than an error.
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
    if (!clientId) return apiFailure("client_id is required", 400);

    const slot = await claimHarvestSlot(clientId, {
      trigger_source: "TENANT_DISPATCHER_SCHEDULED",
    });

    if (!slot.granted) {
      return NextResponse.json(
        {
          success: false,
          granted: false,
          message: `Daily harvest limit reached (${slot.budget.limit} runs across all tenants).`,
          budget: slot.budget,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      granted: true,
      run_id: slot.runId,
      budget: slot.budget,
    });
  } catch (error) {
    return apiError(error, "Failed to claim a harvest slot");
  }
}

/** Read-only budget check, for dashboards and for confirming the cap by hand. */
export async function GET(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  try {
    return NextResponse.json({ success: true, budget: await getHarvestBudget() });
  } catch (error) {
    return apiError(error, "Failed to read the harvest budget");
  }
}
