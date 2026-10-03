import { markCoverFailed, renderAssetCover } from "@/services/cover";
import { settleSlotDraft } from "@/services/contentPlan";
import { readJsonOrEmpty, requireFields } from "@/server/http/body";
import { HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const maxDuration = 60;

// Always leaves the cover READY or FAILED, never PENDING, so a draft never waits on a cover that is not coming.
export const POST = route({ auth: "webhook", failure: "Failed to render cover" }, async ({ request }) => {
  const body = await readJsonOrEmpty(request);
  const { asset_id } = requireFields(body, "asset_id");
  const card = body.card && typeof body.card === "object" ? body.card : {};

  const result = await renderAssetCover(asset_id, { card }).catch(async (error) => {
    await markCoverFailed(asset_id, error instanceof Error ? error.message : "Cover render failed").catch(() => {});
    throw error;
  });
  if (!result.ok && result.locked) throw new HttpError(409, result.error);
  if (!result.ok) {
    await markCoverFailed(asset_id, result.error);
    await settleSlotDraft(asset_id);
    throw new HttpError(422, result.error);
  }

  const slot = await settleSlotDraft(asset_id);
  return {
    success: true,
    hero_status: "READY",
    hero_image_url: result.url,
    layout: result.spec.layout,
    notes: result.spec.notes,
    ...(slot && slot !== "NOT_A_SLOT" ? { slot } : {}),
  };
});
