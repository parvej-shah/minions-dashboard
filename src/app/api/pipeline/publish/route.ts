import { NextResponse } from "next/server";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";

/**
 * Triggers the 03_review_publisher workflow in n8n.
 *
 * The Editorial Studio used to call the n8n webhook straight from the browser,
 * which bypassed this app's auth and error handling and exposed the automation
 * host to any page visitor. It goes through here now, like harvest and draft.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const assetId = typeof body.asset_id === "string" ? body.asset_id.trim() : "";

  if (!assetId) {
    return apiFailure("asset_id is required", 400);
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, clientId: ctx.clientId },
    select: { id: true },
  });
  if (!asset) {
    return apiFailure("Draft not found", 404);
  }

  const { result, status } = await triggerN8nWorkflow(
    "publish",
    {
      asset_id: asset.id,
      client_id: ctx.clientId,
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
