import { NextResponse } from "next/server";
import { apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { AUTOMATION_JOBS } from "@/constants/automations";

/**
 * Server-to-server only: a check-in for the n8n jobs that never otherwise call
 * the dashboard (the stuck-idea sweeper and the error alert). Every other job
 * checks in from the route it already calls on each run.
 */
export async function POST(request: Request) {
  const check = await verifyWebhookSecret(request);
  if (!check.isValid) return check.response!;

  const body = await request.json().catch(() => ({}));
  const job = typeof body.job === "string" ? body.job : "";
  if (!AUTOMATION_JOBS.some((j) => j.key === job)) return apiFailure("job must be one of the known automation keys", 400);

  await recordHeartbeat(job);
  return NextResponse.json({ success: true });
}
