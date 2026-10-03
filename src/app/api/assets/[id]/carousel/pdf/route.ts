import { r2KeyFromUrl } from "@/lib/r2";
import { getCarouselPdfUrl } from "@/services/assets";
import { HttpError, notFound } from "@/server/http/errors";
import { route } from "@/server/http/route";

// Served from our origin: the R2 bucket sends no CORS headers, so the browser cannot read it there.
export const GET = route<"tenant", { id: string }>({ auth: "tenant", failure: "Failed to load the carousel PDF" }, async ({ clientId, params }) => {
  const pdfUrl = await getCarouselPdfUrl(clientId, params.id);
  if (!pdfUrl || !r2KeyFromUrl(pdfUrl)) throw notFound("No carousel PDF");

  const upstream = await fetch(pdfUrl);
  if (!upstream.ok || !upstream.body) throw new HttpError(502, "The carousel PDF could not be read");
  return new Response(upstream.body, {
    headers: { "Content-Type": "application/pdf", "Cache-Control": "private, max-age=86400" },
  });
});
