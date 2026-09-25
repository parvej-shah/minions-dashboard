import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { markCoverFailed, renderAssetCover } from "@/services/cover";

/** Rendering is about a second; the R2 upload and photo fetch add a few more. */
export const maxDuration = 60;

/**
 * Draws a drafted asset's cover in code (phase 5). Called by
 * 02_idea_to_asset right after the asset is saved, with the strategist's
 * cover card. Always leaves the cover READY or FAILED, never PENDING, so a
 * draft never waits on a cover that is not coming.
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const body = await request.json().catch(() => ({}));
  const assetId = typeof body.asset_id === "string" ? body.asset_id.trim() : "";
  if (!assetId) return apiFailure("asset_id is required", 400);
  const card = body.card && typeof body.card === "object" ? body.card : {};

  try {
    const result = await renderAssetCover(assetId, { card });
    if (!result.ok && result.locked) return apiFailure(result.error, 409);
    if (!result.ok) {
      await markCoverFailed(assetId, result.error);
      return apiFailure(result.error, 422);
    }
    return NextResponse.json({ success: true, hero_status: "READY", hero_image_url: result.url, layout: result.spec.layout, notes: result.spec.notes });
  } catch (error) {
    await markCoverFailed(assetId, error instanceof Error ? error.message : "Cover render failed").catch(() => {});
    return apiError(error, "Failed to render cover");
  }
}
