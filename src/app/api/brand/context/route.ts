import { loadBrandContext } from "@/services/brandContextLoader";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

// Tenancy comes from the clientId query param: the caller is n8n, not a signed-in browser.
export const GET = route({ auth: "webhook", failure: "Failed to build brand context" }, async ({ request }) => {
  await recordHeartbeat("01_idea_harvester");
  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) throw badRequest("clientId query param is required");
  return loadBrandContext(clientId);
});
