import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { COVER_LAYOUTS, type CoverLayout } from "@/lib/covers/layouts";
import { renderAssetCover, type CoverEdit } from "@/services/cover";
import { parseArtStyle } from "@/lib/covers/art";

export const maxDuration = 60;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

/**
 * Re-draws an asset's cover, optionally with a reviewer's edit: layout,
 * headline, subtitle, accent word, illustration style, or another illustration. No model call; the edit passes the same
 * honesty checks as generated copy (no figure the draft does not state).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const owned = await prisma.asset.findFirst({ where: { OR: [{ id }, { slug: id }], clientId: ctx.clientId }, select: { id: true } });
    if (!owned) return apiFailure("Asset not found", 404);

    const body = await request.json().catch(() => ({}));
    const layout = typeof body.layout === "string" && COVER_LAYOUTS.includes(body.layout as CoverLayout) ? (body.layout as CoverLayout) : undefined;
    if (body.layout !== undefined && !layout) return apiFailure(`layout must be one of ${COVER_LAYOUTS.join(", ")}`, 400);
    const art = body.art === undefined ? undefined : parseArtStyle(body.art);
    if (art === null) return apiFailure("art must be SHAPES, DOODLES or NONE", 400);
    const edit: CoverEdit = { layout, headline: text(body.headline, 160), kicker: text(body.kicker, 160), emphasis: text(body.emphasis, 40), art, art_reroll: body.art_reroll === true };

    const result = await renderAssetCover(owned.id, { edit });
    if (!result.ok) return apiFailure(result.error, result.locked ? 409 : 422);
    return NextResponse.json({ success: true, hero_image_url: result.url, cover: result.spec });
  } catch (error) {
    return apiError(error, "Failed to render cover");
  }
}
