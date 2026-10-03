import { deleteDirective, updateDirective } from "@/services/brandDirectives";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const PATCH = route<"tenant", Params>({ auth: "tenant", failure: "Failed to update brand directive" }, async ({ clientId, params, request }) =>
  updateDirective(clientId, params.id, await readJson(request))
);

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Failed to delete brand directive" }, async ({ clientId, params }) => {
  await deleteDirective(clientId, params.id);
  return { success: true };
});
