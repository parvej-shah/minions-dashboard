import { disconnectChannel, getChannelSettings, setChannelActive } from "@/services/channels";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch channel settings" }, ({ clientId }) => getChannelSettings(clientId));

export const PATCH = route({ auth: "tenant", failure: "Failed to update channel setting" }, async ({ clientId, request }) =>
  setChannelActive(clientId, await readJson(request))
);

export const DELETE = route({ auth: "tenant", failure: "Failed to disconnect channel" }, async ({ clientId, request }) =>
  disconnectChannel(clientId, await readJson(request))
);
