import { NextResponse } from "next/server";
import { startPublish } from "@/services/pipelineRuns";
import { requireFields, readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

// The Editorial Studio publishes through here rather than calling the n8n webhook from the browser.
export const POST = route({ auth: "tenant", failure: "Failed to start publishing" }, async ({ clientId, request }) => {
  const { asset_id } = requireFields(await readJsonOrEmpty(request), "asset_id");
  const { result, status } = await startPublish(clientId, asset_id);
  return NextResponse.json(result, { status });
});
