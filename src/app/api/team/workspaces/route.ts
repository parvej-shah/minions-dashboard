import { listWorkspaces } from "@/services/team";
import { route } from "@/server/http/route";

export const GET = route({ auth: "session", failure: "Failed to load workspaces" }, ({ user }) => listWorkspaces(user));
