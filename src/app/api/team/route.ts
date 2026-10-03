import { listTeam } from "@/services/team";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load team" }, ({ clientId }) => listTeam(clientId));
