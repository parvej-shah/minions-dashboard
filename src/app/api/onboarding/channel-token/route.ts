import { connectManualChannel } from "@/services/channels";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "realTenant", failure: "Failed to store channel token" }, async ({ clientId, request }) =>
  connectManualChannel(clientId, await readJson(request))
);
