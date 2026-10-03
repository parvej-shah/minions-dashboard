import { NextResponse } from "next/server";
import { startFirstHarvest } from "@/services/onboardingComplete";
import { HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to finish onboarding" }, async ({ clientId }) => {
  const { result, status, runId } = await startFirstHarvest(clientId);
  if (status !== 200) throw new HttpError(status, result.message);
  return NextResponse.json({ ...result, run_id: runId });
});
