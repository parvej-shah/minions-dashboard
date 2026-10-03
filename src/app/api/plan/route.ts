import { getContentPlan, updateContentPlan } from "@/services/contentPlanSettings";
import { readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load the content plan" }, ({ clientId }) => getContentPlan(clientId));

export const PATCH = route({ auth: "tenant", failure: "Failed to save the content plan" }, async ({ clientId, request }) =>
  updateContentPlan(clientId, await readJsonOrEmpty(request))
);
