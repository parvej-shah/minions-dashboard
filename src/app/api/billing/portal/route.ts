import { openBillingPortal } from "@/services/billing";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to open the billing portal" }, ({ clientId, request }) =>
  openBillingPortal(clientId, request.headers.get("origin") ?? new URL(request.url).origin)
);
