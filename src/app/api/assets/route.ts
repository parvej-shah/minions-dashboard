import { listAssets } from "@/services/assets";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch assets" }, ({ clientId }) => listAssets(clientId));
