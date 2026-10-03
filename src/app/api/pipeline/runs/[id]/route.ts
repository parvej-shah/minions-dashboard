import { getPipelineRun, recordRunCallback } from "@/services/pipelineRuns";
import { readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const GET = route<"tenant", Params>({ auth: "tenant", failure: "Failed to load the run" }, ({ clientId, params }) =>
  getPipelineRun(clientId, params.id)
);

// Terminal-state callback from n8n; it requires the webhook secret because a guessed run id could otherwise mark another tenant's run COMPLETED.
export const PATCH = route<"webhook", Params>({ auth: "webhook", failure: "Failed to record the run" }, async ({ params, request }) =>
  recordRunCallback(params.id, await readJsonOrEmpty(request))
);
