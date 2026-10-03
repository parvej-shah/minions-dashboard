import { getPipelineFleet } from "@/services/agents";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch agents" }, ({ clientId }) => getPipelineFleet(clientId));
