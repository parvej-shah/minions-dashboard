import { COVER_LAYOUTS, type CoverLayout } from "@/lib/covers/layouts";
import { COVER_ART_STYLES, parseArtStyle } from "@/lib/covers/art";
import { requireOwnedAssetId } from "@/services/assets";
import { renderAssetCover, type CoverEdit } from "@/services/cover";
import { asOptionalString, readJsonOrEmpty } from "@/server/http/body";
import { HttpError, badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const maxDuration = 60;

/** A list of short strings from the body, or undefined; anything else is refused. */
function stringList(value: unknown, name: string, max = 6): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > max || !value.every((v) => typeof v === "string" && v.length <= 80)) {
    throw badRequest(`${name} must be a list of at most ${max} short lines`);
  }
  return value.map((v: string) => v.trim());
}

export const POST = route<"tenant", { id: string }>({ auth: "tenant", failure: "Failed to render cover" }, async ({ clientId, params, request }) => {
  const assetId = await requireOwnedAssetId(clientId, params.id);
  const body = await readJsonOrEmpty(request);

  const layout = COVER_LAYOUTS.find((candidate) => candidate === body.layout) as CoverLayout | undefined;
  if (body.layout !== undefined && !layout) throw badRequest(`layout must be one of ${COVER_LAYOUTS.join(", ")}`);
  const design = body.design === undefined ? undefined : designId(body.design);
  if (design && layout) throw badRequest("Send a layout or a design, not both.");
  const art = body.art === undefined ? undefined : parseArtStyle(body.art);
  if (art === null) throw badRequest(`art must be one of ${COVER_ART_STYLES.join(", ")}`);

  const edit: CoverEdit = {
    layout,
    design,
    headline: asOptionalString(body.headline, 160),
    kicker: asOptionalString(body.kicker, 160),
    emphasis: asOptionalString(body.emphasis, 40),
    art,
    art_reroll: body.art_reroll === true,
    list: stringList(body.list, "list", 4),
    grid_labels: stringList(body.grid_labels, "grid_labels", 6),
    punch: body.punch === undefined ? undefined : punchOf(body.punch),
  };

  const result = await renderAssetCover(assetId, { edit });
  if (!result.ok) throw new HttpError(result.locked ? 409 : 422, result.error);
  return { success: true, hero_image_url: result.url, cover: result.spec };
});

/** A saved design's id (a UUID); whether it is this workspace's and active is checked when drawing. */
function designId(value: unknown): string {
  if (typeof value !== "string" || !DESIGN_ID.test(value)) throw badRequest("design must be one of your saved designs");
  return value;
}
const DESIGN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function punchOf(value: unknown): { lines: string[]; checks: string[] } {
  const p = (value && typeof value === "object" ? value : {}) as { lines?: unknown; checks?: unknown };
  return { lines: stringList(p.lines, "punch.lines", 4) ?? [], checks: stringList(p.checks, "punch.checks", 4) ?? [] };
}
