import { NextResponse } from "next/server";
import { triggerN8nWorkflow } from "@/services/pipeline";

/**
 * Triggers the 03_review_publisher workflow in n8n.
 *
 * The Editorial Studio used to call the n8n webhook straight from the browser,
 * which bypassed this app's auth and error handling and exposed the automation
 * host to any page visitor. It goes through here now, like harvest and draft.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  const { result, status } = await triggerN8nWorkflow(
    "publish",
    {
      asset_id: body.asset_id ?? null,
      trigger_source: "MINIONS_COCKPIT_EDITORIAL",
    },
    {
      failure:
        "The publisher did not accept the request. Check that 03_review_publisher is active in n8n",
      success: "Publish run started. The post appears on the blog shortly.",
    }
  );

  return NextResponse.json(result, { status });
}
