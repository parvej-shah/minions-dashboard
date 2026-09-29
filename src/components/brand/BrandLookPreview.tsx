"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface BrandLookPreviewColors {
  primary_ink: string;
  brand_teal: string;
  brand_coral: string;
  brand_cream: string;
}

interface BrandLookPreviewProps {
  colors: BrandLookPreviewColors;
  brandName?: string;
  byline?: string;
  logoUrl?: string;
  /** SHAPES, DOODLES, ICONS or NONE. */
  art?: string;
}

/**
 * A real sample cover in this look: the same renderer and checks as a posted
 * cover (/api/brand/cover-preview), redrawn as the colours, byline or photo
 * change, with the chosen illustration style. It used to be a CSS mock of the old 16:9 AI image, which could not
 * show what the renderer actually does (a colour deepened for contrast, a
 * photo that cannot load).
 */
export default function BrandLookPreview({ colors, brandName, byline, logoUrl, art }: BrandLookPreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // One stable string for the effect; it is also the request body.
  const key = JSON.stringify({ ...colors, brand_name: brandName, cover_byline: byline, primary_logo_url: logoUrl, cover_art: art });

  useEffect(() => {
    const controller = new AbortController();
    // Wait for the colour picker to settle before drawing.
    const timer = window.setTimeout(() => {
      setLoading(true);
      void (async () => {
        try {
          const res = await fetch("/api/brand/cover-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: key,
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blobUrl = URL.createObjectURL(await res.blob());
          setSrc((old) => {
            if (old) URL.revokeObjectURL(old);
            return blobUrl;
          });
          try {
            setNotes(JSON.parse(decodeURIComponent(res.headers.get("X-Cover-Notes") ?? "%5B%5D")));
          } catch {
            setNotes([]);
          }
          setFailed(false);
        } catch (e) {
          if ((e as Error).name !== "AbortError") setFailed(true);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-[#94A3B8] block">Cover preview (how every post&apos;s cover is drawn)</label>
      <div className="relative w-full max-w-[240px] aspect-[4/5] rounded-lg border border-[#1F2D3D] overflow-hidden bg-[#070B0F]">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Sample cover in this look" className={`w-full h-full object-cover transition-opacity ${loading ? "opacity-50" : ""}`} />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#00C9A7] animate-spin" />
          </div>
        )}
        {failed && !loading && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-[#94A3B8]">The preview could not be drawn.</div>
        )}
      </div>
      {notes.length > 0 && (
        <ul className="text-[11px] text-[#F59E0B] space-y-0.5 max-w-sm">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
