import { createMemory, listMemory } from "@/services/memory";
import { created } from "@/server/http/respond";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load your experience" }, ({ clientId }) => listMemory(clientId));

export const POST = route({ auth: "tenant", failure: "Failed to save that experience" }, async ({ clientId, request }) =>
  created(await createMemory(clientId, await readJson(request, "Expected a JSON object.")))
);
