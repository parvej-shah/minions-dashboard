import { COVER_LAYOUTS, type CoverLayout } from "@/lib/covers/layouts";
import { COVER_ART_STYLES, parseArtStyle } from "@/lib/covers/art";
import { requireOwnedAssetId } from "@/services/assets";
import { renderAssetCover, type CoverEdit } from "@/services/cover";
import { asOptionalString, readJsonOrEmpty } from "@/server/http/body";
import { HttpError, badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const maxDuration = 60;

export const POST = route<"tenant", { id: string }>({ auth: "tenant", failure: "Failed to render cover" }, async ({ clientId, params, request }) => {
  const assetId = await requireOwnedAssetId(clientId, params.id);
  const body = await readJsonOrEmpty(request);

  const layout = COVER_LAYOUTS.find((candidate) => candidate === body.layout) as CoverLayout | undefined;
  if (body.layout !== undefined && !layout) throw badRequest(`layout must be one of ${COVER_LAYOUTS.join(", ")}`);
  const art = body.art === undefined ? undefined : parseArtStyle(body.art);
  if (art === null) throw badRequest(`art must be one of ${COVER_ART_STYLES.join(", ")}`);

  const edit: CoverEdit = {
    layout,
    headline: asOptionalString(body.headline, 160),
    kicker: asOptionalString(body.kicker, 160),
    emphasis: asOptionalString(body.emphasis, 40),
    art,
    art_reroll: body.art_reroll === true,
  };

  const result = await renderAssetCover(assetId, { edit });
  if (!result.ok) throw new HttpError(result.locked ? 409 : 422, result.error);
  return { success: true, hero_image_url: result.url, cover: result.spec };
});
