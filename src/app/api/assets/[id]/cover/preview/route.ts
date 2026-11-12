import { COVER_LAYOUTS, type CoverLayout } from "@/lib/covers/layouts";
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
  const t1 = performance.now();
  const layout = COVER_LAYOUTS.find((l) => l === new URL(request.url).searchParams.get("layout")) as CoverLayout | undefined;
  if (!layout) throw badRequest(`layout must be one of ${COVER_LAYOUTS.join(", ")}`);
  // renderLayoutPreview reads the asset by id and refuses another workspace's, so no separate ownership query.
  const result = await renderLayoutPreview(clientId, params.id, layout);
  const t2 = performance.now();
  if (!result.ok) throw new HttpError(result.status, result.error);
  const headers: Record<string, string> = { "Content-Type": result.type, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff", "Server-Timing": `tile;dur=${(t2 - t1).toFixed(0)}` };
  // An SVG opened on its own is a document: it may only show its own embedded pictures.
  if (result.type === "image/svg+xml") headers["Content-Security-Policy"] = "default-src 'none'; img-src data:; style-src 'unsafe-inline'";
  return new Response(new Uint8Array(result.body), { headers });
});
