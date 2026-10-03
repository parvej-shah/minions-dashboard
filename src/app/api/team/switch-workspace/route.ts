import { switchWorkspace } from "@/services/team";
import { asString, readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "session", failure: "Failed to switch workspace" }, async ({ user, request }) =>
  switchWorkspace(user, asString((await readJson(request)).client_id))
);
