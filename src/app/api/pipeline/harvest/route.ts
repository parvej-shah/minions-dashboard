import { NextResponse } from "next/server";
import { startHarvest } from "@/services/harvestRun";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Harvest trigger failed" }, async ({ clientId }) => {
  const { status, ...result } = await startHarvest(clientId, "MINIONS_COCKPIT_MANUAL");
  return NextResponse.json(result, { status });
});
