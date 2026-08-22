import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/lib/api-response";
import { triggerN8nWorkflow } from "@/services/pipeline";
import { requireClientId } from "@/lib/tenant";

/**
 * Triggers the live 02_idea_to_asset workflow in n8n.
 *
 * This route does NOT synthesize an asset. The workflow claims an idea, drafts it,
 * runs the claims gate and syncs the finished asset into the `assets` table
 * (roughly 150s later), so the caller should poll /api/assets for the result.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  // An empty body is valid: the workflow picks the next available idea itself.
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const ideaId = (body.idea_id as string | null) ?? null;

  // One idea -> one asset. n8n's own Select Target refuses an idea that already
  // carries a draft_asset_id, but that check runs a minute into the workflow and
  // only covers the ideas table. Refusing here means a double-click, a stale tab,
  // or a retry never even starts a second run, and the operator gets told why.
  if (ideaId) {
    const [idea, existingAsset] = await Promise.all([
      prisma.idea.findFirst({
        where: { id: ideaId, clientId: ctx.clientId },
        select: { id: true, draftAssetId: true, status: true },
      }),
      prisma.asset.findFirst({
        where: { ideaId, clientId: ctx.clientId },
        select: { id: true, title: true },
      }),
    ]);

    if (!idea) {
      return apiFailure(`Idea ${ideaId} does not exist.`, 404);
    }

    const assetId = existingAsset?.id ?? idea.draftAssetId;
    if (assetId) {
      return apiFailure(
        `This idea already has a draft (asset ${assetId}). Delete that asset first if you want to draft it again.`,
        409
      );
    }

    if (idea.status === "PICKED") {
      return apiFailure(
        "A drafting run already claimed this idea and is still working on it. Wait for it to finish, or reset the claim from the Idea Stream.",
        409
      );
    }
  }

  const { result, status } = await triggerN8nWorkflow(
    "draft",
    {
      client_id: ctx.clientId,
      idea_id: ideaId,
      title: body.title ?? null,
      audience: body.audience ?? null,
      trade: body.target_trade ?? null,
      trigger_source: "MINIONS_COCKPIT_EDITORIAL",
    },
    {
      failure:
        "The drafting pipeline did not accept the request. Check that 02_idea_to_asset is active in n8n",
      success:
        "Drafting run started. The finished draft appears in the Editorial Studio in about three minutes.",
    }
  );

  return NextResponse.json({ ...result, requested_idea_id: ideaId }, { status });
}
