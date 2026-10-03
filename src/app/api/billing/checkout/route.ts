import { startCheckout } from "@/services/billing";
import { asString, readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to start checkout" }, async ({ clientId, user, request }) => {
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  return startCheckout(clientId, user, asString((await readJson(request)).plan_key), origin);
});
