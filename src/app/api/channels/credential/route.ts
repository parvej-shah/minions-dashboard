import { resolveChannelCredential } from "@/services/channels";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const GET = route({ auth: "webhook", failure: "Failed to resolve channel credential" }, ({ request }) => {
  const query = new URL(request.url).searchParams;
  const clientId = query.get("clientId");
  const channel = query.get("channel");
  if (!clientId || !channel) throw badRequest("clientId and channel query params are required");
  return resolveChannelCredential(clientId, channel, query.get("assetId"));
});
