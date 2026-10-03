import { deleteIdeaSource, updateIdeaSource } from "@/services/ideaSources";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const PATCH = route<"tenant", Params>({ auth: "tenant", failure: "Failed to update idea source" }, async ({ clientId, params, request }) =>
  updateIdeaSource(clientId, params.id, await readJson(request))
);

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Failed to delete idea source" }, async ({ clientId, params }) => {
  await deleteIdeaSource(clientId, params.id);
  return { success: true };
});
