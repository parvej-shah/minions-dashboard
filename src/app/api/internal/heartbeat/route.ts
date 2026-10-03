import { recordHeartbeat } from "@/services/jobHeartbeat";
import { AUTOMATION_JOBS } from "@/constants/automations";
import { asString, readJsonOrEmpty } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

// Check-in for the n8n jobs that never otherwise call the dashboard (the stuck-idea sweeper and the error alert).
export const POST = route({ auth: "webhook", failure: "Failed to record the heartbeat" }, async ({ request }) => {
  const job = asString((await readJsonOrEmpty(request)).job);
  if (!AUTOMATION_JOBS.some((known) => known.key === job)) throw badRequest("job must be one of the known automation keys");
  await recordHeartbeat(job);
  return { success: true };
});
