import { pulseHistory } from "@/services/pulse";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load your weekly updates" }, ({ clientId }) => pulseHistory(clientId));
