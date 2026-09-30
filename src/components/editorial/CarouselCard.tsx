"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, GalleryHorizontal, Loader2, PenLine, RefreshCw, Sparkles } from "lucide-react";
import type { AssetItem } from "@/types";
import type { StoredCarousel } from "@/services/carousel";
import type { CarouselPlan } from "@/lib/carousel/plan";
import type { Slide } from "@/lib/carousel/slides";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CarouselPdfPages from "./CarouselPdfPages";

import { buttonStyles } from "@/components/ui/Button";
interface State {
  carousel: StoredCarousel | null;
  suggested: { yes: boolean; reason: string };
  locked: boolean;
}

/** The editable text fields of each layout, in the order they appear on the slide. */
const FIELDS: Record<Slide["layout"], { key: string; label: string; long?: boolean }[]> = {
  STAKES: [{ key: "statement", label: "Statement", long: true }, { key: "body", label: "Line under it", long: true }],
  POINT: [{ key: "title", label: "Point" }, { key: "body", label: "Line under it", long: true }],
  STEP: [{ key: "title", label: "Step" }, { key: "body", label: "Line under it", long: true }],
  CONTRAST: [{ key: "before", label: "Common assumption", long: true }, { key: "after", label: "In practice", long: true }],
  CHECKLIST: [{ key: "title", label: "Title" }, { key: "items", label: "Items, one per line", long: true }],
  NUMBER: [{ key: "value", label: "Figure" }, { key: "unit", label: "Unit" }, { key: "caption", label: "Caption", long: true }],
  QUOTE: [{ key: "quote", label: "Quote", long: true }, { key: "attribution", label: "Attribution" }],
  CLOSE: [{ key: "takeaway", label: "Takeaway", long: true }, { key: "saveLine", label: "Save line" }],
};

const LAYOUT_NAMES: Record<Slide["layout"], string> = {
  STAKES: "Why it matters", POINT: "Point", STEP: "Step", CONTRAST: "Assumption vs practice", CHECKLIST: "Checklist", NUMBER: "Figure", QUOTE: "Quote", CLOSE: "Close",
};

const input = "w-full bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-brand resize-none";
const pageClass = "snap-start shrink-0 w-[70%] sm:w-[220px] aspect-[4/5] rounded-lg border border-line object-cover";
const ghostButton = "px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-medium text-brand border border-brand/30 hover:border-brand transition-all inline-flex items-center gap-1.5 disabled:opacity-50";

/**
 * The draft's LinkedIn carousel (phase 11, D19). Suggested, never automatic:
 * the reviewer makes one, checks every page, edits the words (redrawn with no
 * model call, through the same checks), and decides whether LinkedIn gets the
 * carousel or the cover image. Once the draft is published it is shown as it
 * went out.
 */
export default function CarouselCard({ activeAsset, onMessage }: { activeAsset: AssetItem; onMessage: (message: string) => void }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState<"make" | "save" | "toggle" | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [draft, setDraft] = useState<CarouselPlan | null>(null);
  const [confirmRemake, setConfirmRemake] = useState(false);
  const url = `/api/assets/${encodeURIComponent(activeAsset.id)}/carousel`;

  // The studio keys this card by draft, so a new draft starts from empty state.
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setState({ carousel: json.carousel, suggested: json.suggested, locked: json.locked });
      })
      .catch(() => {
        // The card stays hidden; the rest of the review works without it.
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const send = async (method: "POST" | "PATCH", body: unknown, kind: "make" | "save" | "toggle") => {
    setBusy(kind);
    setErrors([]);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        setState((s) => (s ? { ...s, carousel: json.carousel } : s));
        setDraft(null);
        onMessage(kind === "make" ? "Carousel ready. Check every page." : kind === "save" ? "Carousel redrawn." : json.carousel.active ? "LinkedIn will post the carousel." : "LinkedIn will post the cover image.");
      } else {
        setErrors(json.errors?.length ? json.errors : []);
        onMessage(json.error ?? "The carousel could not be updated.");
      }
    } catch {
      onMessage("The carousel could not be updated. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  if (!state) return null;
  const { carousel, suggested, locked } = state;
  const pages = carousel?.pages;
  // The cover, then one page per slide.
  const pageCount = carousel ? carousel.plan.slides.length + 1 : 0;

  const setSlide = (i: number, key: string, value: string) =>
    setDraft((d) => {
      if (!d) return d;
      const slides = d.slides.map((s, j) => (j === i ? ({ ...s, [key]: key === "items" ? value.split("\n") : value } as Slide) : s));
      return { ...d, slides };
    });

  const saveEdit = () => {
    if (!draft) return;
    const clean = { ...draft, slides: draft.slides.map((s) => (s.layout === "CHECKLIST" ? { ...s, items: s.items.map((x) => x.trim()).filter(Boolean) } : s)) };
    void send("PATCH", { plan: clean }, "save");
  };

  return (
    <div className="bg-surface rounded-2xl border border-line p-4 sm:p-5 space-y-3 shadow-xl">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-line/60">
        <div className="flex items-center gap-2">
          <GalleryHorizontal className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold text-ink font-mono uppercase tracking-wider">LinkedIn carousel</span>
        </div>
        <span className="text-[10px] font-mono text-subtle">
          {busy === "make" ? "Writing the slides…" : carousel ? `${carousel.active ? "On" : "Off"} · ${pageCount} pages` : suggested.yes ? "Suggested" : "Optional"}
        </span>
      </div>

      {!carousel ? (
        <div className="space-y-2">
          <p className="text-xs leading-relaxed text-muted">
            {suggested.yes ? <Sparkles className="inline w-3 h-3 mr-1 text-brand" /> : null}
            {suggested.reason} A carousel is a swipeable PDF on LinkedIn, drawn in your brand. It says only what this draft says.
          </p>
          {locked ? (
            <p className="text-xs text-subtle">This draft is published without a carousel.</p>
          ) : (
            <button type="button" disabled={busy !== null} onClick={() => void send("POST", null, "make")} className={ghostButton}>
              {busy === "make" ? <Loader2 className="w-3 h-3 animate-spin" /> : <GalleryHorizontal className="w-3 h-3" />}
              {busy === "make" ? "Writing the slides, about a minute" : "Make carousel"}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Swipe through the pages as LinkedIn shows them. */}
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
            {pages?.length ? (
              // Carousels drawn before the PDF became the only file keep their page images.
              pages.map((page, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={page} src={page} alt={`Page ${i + 1} of ${pages.length}`} className={`${pageClass} ${busy ? "opacity-40" : ""}`} />
              ))
            ) : (
              // The render time in the URL, so a redraw never shows the cached PDF.
              <CarouselPdfPages src={`${url}/pdf?v=${encodeURIComponent(carousel.rendered_at)}`} pageClassName={`${pageClass} ${busy ? "opacity-40" : ""}`} />
            )}
          </div>

          {locked ? (
            <p className="text-xs leading-relaxed text-muted">
              This draft is published, so its carousel stays exactly as it went out{carousel.active ? "" : " (LinkedIn got the cover image)"}.
            </p>
          ) : (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 accent-brand w-4 h-4"
                checked={carousel.active}
                disabled={busy !== null}
                onChange={(e) => void send("PATCH", { active: e.target.checked }, "toggle")}
              />
              <span className="text-xs leading-relaxed text-ink">
                Post to LinkedIn as this carousel
                <span className="block text-subtle">Off: LinkedIn gets the cover image and the LinkedIn text below, as usual.</span>
              </span>
            </label>
          )}

          {draft ? (
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-medium text-muted block mb-1">Cover headline</span>
                <input className={input} value={draft.cover.headline} onChange={(e) => setDraft({ ...draft, cover: { ...draft.cover, headline: e.target.value } })} />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-muted block mb-1">Cover subtitle</span>
                <input className={input} value={draft.cover.kicker ?? ""} onChange={(e) => setDraft({ ...draft, cover: { ...draft.cover, kicker: e.target.value } })} />
              </label>
              {draft.slides.map((slide, i) => (
                <fieldset key={i} className="border border-line rounded-lg p-2.5 space-y-2">
                  <legend className="px-1 text-[10px] font-mono uppercase tracking-wider text-subtle">
                    Page {i + 2} · {LAYOUT_NAMES[slide.layout]}
                  </legend>
                  {FIELDS[slide.layout].map((f) => {
                    const raw = (slide as unknown as Record<string, unknown>)[f.key];
                    const value = Array.isArray(raw) ? raw.join("\n") : typeof raw === "string" ? raw : "";
                    return (
                      <label key={f.key} className="block">
                        <span className="text-[11px] text-muted block mb-1">{f.label}</span>
                        {f.long ? (
                          <textarea rows={f.key === "items" ? 4 : 2} className={input} value={value} onChange={(e) => setSlide(i, f.key, e.target.value)} />
                        ) : (
                          <input className={input} value={value} onChange={(e) => setSlide(i, f.key, e.target.value)} />
                        )}
                      </label>
                    );
                  })}
                </fieldset>
              ))}
              <label className="block">
                <span className="text-[11px] font-medium text-muted block mb-1">Post text above the carousel</span>
                <textarea rows={6} className={input} value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-muted block mb-1">Document title (shown on LinkedIn)</span>
                <input className={input} value={draft.documentTitle} onChange={(e) => setDraft({ ...draft, documentTitle: e.target.value })} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy !== null} onClick={saveEdit} className={buttonStyles({ size: "sm" })}>
                  {busy === "save" && <Loader2 className="w-3 h-3 animate-spin" />}
                  Redraw carousel
                </button>
                <button type="button" onClick={() => { setDraft(null); setErrors([]); }} className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-xs text-ink">
                  Cancel
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-subtle">Edits pass the same checks: word limits, every page fits, and no figure the draft does not state.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg bg-surface-2 border border-line p-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-subtle block mb-1">Post text with the carousel</span>
                <p className="text-xs leading-relaxed text-ink whitespace-pre-line">{carousel.caption}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!locked && (
                  <>
                    <button type="button" disabled={busy !== null} onClick={() => setDraft(structuredClone(carousel.plan))} className={ghostButton}>
                      <PenLine className="w-3 h-3" /> Edit wording
                    </button>
                    <button type="button" disabled={busy !== null} onClick={() => setConfirmRemake(true)} className={ghostButton}>
                      {busy === "make" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {busy === "make" ? "Writing the slides…" : "Make again"}
                    </button>
                  </>
                )}
                <a href={carousel.pdf_url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-medium text-muted border border-line hover:border-brand transition-all inline-flex items-center gap-1.5">
                  Open PDF <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 p-2.5 space-y-1">
          <span className="text-xs font-semibold text-gold inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Not saved. Fix these:
          </span>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] leading-relaxed text-ink">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmRemake}
        title="Make the carousel again?"
        description="The slides are written again from the draft, and any edits you made to this carousel are replaced."
        confirmLabel="Make again"
        cancelLabel="Keep this one"
        variant="warning"
        isLoading={false}
        onConfirm={() => {
          setConfirmRemake(false);
          void send("POST", null, "make");
        }}
        onClose={() => setConfirmRemake(false)}
      />
    </div>
  );
}
