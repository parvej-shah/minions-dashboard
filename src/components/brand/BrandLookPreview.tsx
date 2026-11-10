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
  /** No caption above it: the card around it already says what it is. */
  bare?: boolean;
}

/**
 * A real sample cover in this look: the same renderer and checks as a posted
 * cover (/api/brand/cover-preview), redrawn as the colours, byline or photo
 * change, with the chosen illustration style. Drawing it with the real renderer
 * shows what a mock could not: a colour deepened for contrast, a photo that
 * cannot load.
 */
export default function BrandLookPreview({ colors, brandName, byline, logoUrl, art, bare }: BrandLookPreviewProps) {
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
      {!bare && <p className="block text-sm text-muted">A sample cover in this look</p>}
      <div className="relative w-full max-w-[240px] aspect-[4/5] overflow-hidden rounded-2xl bg-canvas ring-1 ring-line">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Sample cover in this look" className={`w-full h-full object-cover transition-opacity ${loading ? "opacity-50" : ""}`} />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        )}
        {failed && !loading && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-muted">The preview could not be drawn.</div>
        )}
      </div>
      {notes.length > 0 && (
        <ul className="max-w-sm space-y-0.5 text-sm text-gold">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
