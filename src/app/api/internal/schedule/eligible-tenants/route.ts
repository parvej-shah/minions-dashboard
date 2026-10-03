import { recordHeartbeat } from "@/services/jobHeartbeat";
import { findDueTenants } from "@/services/dueTenants";
import { route } from "@/server/http/route";

// Polled by 00b_posting_scheduler_dispatcher every 5 minutes. Each call runs every filler-enabled
// workspace's look-ahead and returns the tenants with a due slot, naming the idea 02 should draft.
export const GET = route({ auth: "webhook", failure: "Failed to compute due tenants" }, async () => {
  await recordHeartbeat("00b_posting_scheduler_dispatcher");
  return findDueTenants();
});
