import { updateClaim } from "@/services/claims";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const PATCH = route<"tenant", { id: string }>({ auth: "tenant", failure: "Failed to update claim" }, async ({ clientId, params, request }) => ({
  success: true,
  claim: await updateClaim(clientId, params.id, await readJson(request)),
}));
