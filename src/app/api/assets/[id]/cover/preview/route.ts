import { COVER_LAYOUTS, type CoverLayout } from "@/lib/covers/layouts";
import { requireOwnedAssetId } from "@/services/assets";
import { renderLayoutPreview } from "@/services/coverPreview";
import { HttpError, badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const maxDuration = 30;

/**
 * One tile of the layout picker: this post's own cover words drawn in `layout`
 * (tasks/53.md). Read-only. `v` names the words, so a tile is cached by the
 * browser until the post's text changes; a day at most, in case the brand did.
 */
export const GET = route<"tenant", { id: string }>({ auth: "tenant", failure: "Failed to draw the layout preview" }, async ({ clientId, params, request }) => {
  const assetId = await requireOwnedAssetId(clientId, params.id);
  const layout = COVER_LAYOUTS.find((l) => l === new URL(request.url).searchParams.get("layout")) as CoverLayout | undefined;
  if (!layout) throw badRequest(`layout must be one of ${COVER_LAYOUTS.join(", ")}`);
  const result = await renderLayoutPreview(clientId, assetId, layout);
  if (!result.ok) throw new HttpError(result.status, result.error);
  return new Response(new Uint8Array(result.webp), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=86400" } });
});
