import { inviteMember } from "@/services/team";
import { readJson } from "@/server/http/body";
import { created } from "@/server/http/respond";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to invite team member" }, async ({ clientId, user, request }) =>
  created(await inviteMember(clientId, user, await readJson(request)))
);
