import { getBillingSummary } from "@/services/billing";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch billing summary" }, ({ clientId }) => getBillingSummary(clientId));
