import { NextResponse } from "next/server";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { claimHarvestSlot, getHarvestBudget } from "@/lib/harvestBudget";
import { isHarvestReady } from "@/services/harvestReady";
import { readJsonOrEmpty, requireFields } from "@/server/http/body";
import { route } from "@/server/http/route";

// 00_tenant_dispatcher reserves one unit of the system-wide daily harvest budget per tenant.
// A 429 is a normal outcome: the dispatcher skips that tenant for the day.
export const POST = route({ auth: "webhook", failure: "Failed to claim a harvest slot" }, async ({ request }) => {
  await recordHeartbeat("00_tenant_dispatcher");
  const { client_id } = requireFields(await readJsonOrEmpty(request), "client_id");

  // A workspace that never saved its brand brief has nothing to judge ideas against; skip it (no run row, no budget).
  if (!(await isHarvestReady(client_id))) {
    return NextResponse.json({ success: false, granted: false, message: "Workspace setup is not finished; harvest skipped." }, { status: 422 });
  }

  const slot = await claimHarvestSlot(client_id, { trigger_source: "TENANT_DISPATCHER_SCHEDULED" });
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
  return { success: true, granted: true, run_id: slot.runId, budget: slot.budget };
});

export const GET = route({ auth: "webhook", failure: "Failed to read the harvest budget" }, async () => ({
  success: true,
  budget: await getHarvestBudget(),
}));
