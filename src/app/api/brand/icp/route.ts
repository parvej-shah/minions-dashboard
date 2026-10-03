import { getIcp, saveIcp } from "@/services/icp";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load your ideal customer" }, ({ clientId }) => getIcp(clientId));

export const PUT = route({ auth: "tenant", failure: "Failed to save your ideal customer" }, async ({ clientId, request }) =>
  saveIcp(clientId, await request.json().catch(() => null))
);
