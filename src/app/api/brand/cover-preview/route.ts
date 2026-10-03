import { apiError } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { renderCoverPreview } from "@/services/cover";

export const maxDuration = 30;

const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 500) : undefined);

/**
 * A sample cover in the workspace's look, with the Brand page's unsaved
 * colours, byline and photo. Returns the PNG; notes about replaced colours or
 * an unreadable photo come back in the X-Cover-Notes header.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;
  try {
    const body = await request.json().catch(() => ({}));
    const { png, notes } = await renderCoverPreview(ctx.clientId, {
      brand_name: str(body.brand_name),
      primary_ink: str(body.primary_ink),
      brand_cream: str(body.brand_cream),
      brand_coral: str(body.brand_coral),
      brand_teal: str(body.brand_teal),
      cover_byline: str(body.cover_byline),
      primary_logo_url: str(body.primary_logo_url),
      positioning: str(body.positioning),
      cover_art: str(body.cover_art),
    });
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store", "X-Cover-Notes": encodeURIComponent(JSON.stringify(notes)) },
    });
  } catch (error) {
    return apiError(error, "Failed to render the cover preview");
  }
}
