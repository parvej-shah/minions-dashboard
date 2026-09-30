"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PDFDocumentLoadingTask } from "pdfjs-dist";

/** Drawn at twice the card's width, so pages stay sharp on retina screens. */
const DRAW_WIDTH = 440;

/**
 * The carousel's pages, drawn from the PDF LinkedIn gets, so the reviewer sees
 * exactly that file. pdf.js loads only when a carousel is shown.
 */
export default function CarouselPdfPages({ src, pageClassName }: { src: string; pageClassName: string }) {
  const holder = useRef<HTMLDivElement>(null);
  // Keyed by the PDF drawn, so a new src reads as loading without resetting state in the effect.
  const [drawn, setDrawn] = useState<{ src: string; ok: boolean } | null>(null);
  const status = drawn?.src !== src ? "loading" : drawn.ok ? "ready" : "failed";

  useEffect(() => {
    let cancelled = false;
    // Held in an object, so the cleanup sees the load the async code started.
    const open: { task?: PDFDocumentLoadingTask } = {};
    const el = holder.current;

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      open.task = pdfjs.getDocument({ url: src });
      const pdf = await open.task.promise;
      const canvases: HTMLCanvasElement[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: DRAW_WIDTH / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.className = pageClassName;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `Page ${n} of ${pdf.numPages}`);
        await page.render({ canvas, viewport }).promise;
        if (cancelled) return;
        canvases.push(canvas);
      }
      if (cancelled || !el) return;
      el.replaceChildren(...canvases);
      setDrawn({ src, ok: true });
    })().catch((e) => {
      console.warn("[carousel] could not draw the PDF:", e);
      if (!cancelled) setDrawn({ src, ok: false });
    });

    return () => {
      cancelled = true;
      void open.task?.destroy();
    };
  }, [src, pageClassName]);

  return (
    <>
      {status === "loading" && (
        <div className="flex items-center gap-2 text-xs text-muted py-6">
          <Loader2 className="w-3 h-3 animate-spin" /> Drawing the pages
        </div>
      )}
      {status === "failed" && <p className="text-xs text-muted py-2">The preview could not be drawn. Open the PDF to check the pages.</p>}
      <div ref={holder} className="contents" />
    </>
  );
}
