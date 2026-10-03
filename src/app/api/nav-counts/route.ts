import { getNavCounts } from "@/services/navCounts";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch nav counts" }, ({ clientId }) => getNavCounts(clientId));
