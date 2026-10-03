import { getPlanStatus } from "@/services/contentPlan";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Could not load the drafting status" }, ({ clientId }) => getPlanStatus(clientId));
