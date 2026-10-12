import { applyBrandImport } from "@/services/brandImport";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to save your brand" }, async ({ clientId, request }) =>
  applyBrandImport(clientId, await readJson(request))
);
