import { deleteMemory, updateMemory } from "@/services/memory";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const PATCH = route<"tenant", Params>({ auth: "tenant", failure: "Failed to update that experience" }, async ({ clientId, params, request }) =>
  updateMemory(clientId, params.id, await readJson(request, "Expected a JSON object."))
);

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Failed to delete that experience" }, async ({ clientId, params }) => {
  await deleteMemory(clientId, params.id);
  return new Response(null, { status: 204 });
});
