import { NextResponse } from "next/server";
import { startDraftRun } from "@/services/drafting";
import { asString, readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Draft trigger failed" }, async ({ clientId, request }) => {
  const body = await readJsonOrEmpty(request);
  const ideaId = asString(body.idea_id) || null;
  const run = await startDraftRun(clientId, ideaId, body);
  return NextResponse.json(
    { ...run.result, requested_idea_id: ideaId, run_id: run.runId, budget: run.budget },
    { status: run.status }
  );
});
