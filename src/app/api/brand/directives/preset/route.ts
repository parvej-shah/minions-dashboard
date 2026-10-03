import { applyPreset } from "@/services/brandDirectives";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to apply starter pack preset" }, async ({ clientId, request }) =>
  applyPreset(clientId, (await readJson(request)).presetId)
);
