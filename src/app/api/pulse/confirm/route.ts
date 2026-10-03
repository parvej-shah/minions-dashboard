import { confirmPulse } from "@/services/pulse";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to save these items" }, async ({ clientId, request }) =>
  confirmPulse(clientId, await readJson(request, "Expected a JSON object."))
);
