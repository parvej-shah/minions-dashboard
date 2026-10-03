import { updatePulseSettings } from "@/services/pulse";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const PATCH = route({ auth: "tenant", failure: "Failed to save the weekly question settings" }, async ({ clientId, request }) =>
  updatePulseSettings(clientId, await readJson(request, "Expected a JSON object."))
);
