import { checkMemoryDraft } from "@/services/memory";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Could not check that text" }, async ({ clientId, request }) =>
  checkMemoryDraft(clientId, await readJson(request, "Expected a JSON object."))
);
