import { changeMemberRole, removeMember } from "@/services/team";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const PATCH = route<"tenant", Params>({ auth: "tenant", failure: "Failed to update team member" }, async ({ clientId, user, params, request }) =>
  changeMemberRole(clientId, user, params.id, await readJson(request))
);

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Failed to remove team member" }, async ({ clientId, user, params }) => {
  await removeMember(clientId, user, params.id);
  return { success: true };
});
