import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { r2KeyFromUrl } from "@/lib/r2";

/**
 * The carousel PDF from our own origin, for the review card's preview. The R2
 * bucket sends no CORS headers, so the browser cannot read the file there.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireClientId();
    if ("error" in ctx) return ctx.error;
    const id = (await params).id;
    const asset = await prisma.asset.findFirst({ where: { OR: [{ id }, { slug: id }], clientId: ctx.clientId }, select: { carouselSpec: true } });
    const pdfUrl = (asset?.carouselSpec as { pdf_url?: string } | null)?.pdf_url;
    // Only our own bucket, so the route never fetches an arbitrary URL.
    if (!pdfUrl || !r2KeyFromUrl(pdfUrl)) return apiFailure("No carousel PDF", 404);
    const upstream = await fetch(pdfUrl);
    if (!upstream.ok || !upstream.body) return apiFailure("The carousel PDF could not be read", 502);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        // Every render lives under a new folder, so one URL never changes.
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    return apiError(error, "Failed to load the carousel PDF");
  }
}
