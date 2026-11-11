import { r2KeyFromUrl } from "@/lib/r2";
import { getCarouselPageUrls } from "@/services/assets";
import { HttpError, notFound } from "@/server/http/errors";
import { route } from "@/server/http/route";

// One carousel page as a JPEG download, from our origin: the R2 bucket sends no CORS headers,
// so the browser could not fetch it there to hand to the share sheet or save it.
export const GET = route<"tenant", { id: string; n: string }>({ auth: "tenant", failure: "Failed to load the carousel page" }, async ({ clientId, params }) => {
  const pages = await getCarouselPageUrls(clientId, params.id);
  const n = /^\d+$/.test(params.n) ? Number(params.n) : 0;
  const url = pages[n - 1];
  if (!url || !r2KeyFromUrl(url)) throw notFound("No such carousel page");

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) throw new HttpError(502, "The carousel page could not be read");
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="page-${String(n).padStart(2, "0")}.jpg"`,
      "Cache-Control": "private, max-age=86400",
    },
  });
});
