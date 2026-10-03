import { gateHarvestRequest } from "@/services/harvestGate";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "webhook", failure: "Failed to gate harvested ideas" }, async ({ request }) =>
  gateHarvestRequest(await readJson(request))
);
