import { getScheduleSettings, saveScheduleSettings } from "@/services/postingSchedule";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load posting schedule" }, ({ clientId }) => getScheduleSettings(clientId));

export const PATCH = route({ auth: "tenant", failure: "Failed to save posting schedule" }, async ({ clientId, request }) =>
  saveScheduleSettings(clientId, await readJson(request))
);
