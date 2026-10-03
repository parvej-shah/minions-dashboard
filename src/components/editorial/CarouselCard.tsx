"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, GalleryHorizontal, Loader2, PenLine, RefreshCw, Sparkles } from "lucide-react";
import type { AssetItem } from "@/types";
import type { StoredCarousel } from "@/services/carousel";
import type { CarouselPlan } from "@/lib/carousel/plan";
import type { Slide } from "@/lib/carousel/slides";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CarouselPdfPages from "./CarouselPdfPages";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

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
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
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
        if (cancelled) return;
        if (json.success) setState({ carousel: json.carousel, suggested: json.suggested, locked: json.locked });
        else setLoadError(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, loadAttempt]);

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

  if (!state && loadError) return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="font-semibold text-ink">Could not load the LinkedIn carousel</p>
      <button type="button" onClick={() => { setLoadError(false); setLoadAttempt((n) => n + 1); }} className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-brand/40 px-4 text-sm font-bold text-brand cursor-pointer hover:bg-brand/10">Try again</button>
    </div>
  );
  if (!state) return (
    <SkeletonGroup label="Loading LinkedIn carousel" className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-line pb-3"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-16" /></div>
      <div className="space-y-3 rounded-2xl border-2 border-line bg-canvas p-4">
        <Skeleton className="h-5 w-64 max-w-full" /><Skeleton className="h-4 w-72 max-w-full" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
      </div>
      <div className="flex gap-2 overflow-hidden">{[0, 1, 2].map((item) => <Skeleton key={item} className="aspect-[4/5] w-[70%] shrink-0 rounded-lg sm:w-[220px]" />)}</div>
      <Skeleton className="h-28 w-full rounded-xl" />
    </SkeletonGroup>
  );
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
          {busy === "make" ? "Writing the slides…" : carousel ? `${pageCount} pages` : suggested.yes ? "Suggested" : "Optional"}
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
          {/* A second post that exists to share the carousel has no choice to make. */}
          {!locked && activeAsset.follow_up_format !== "CAROUSEL" && (
            <div className="rounded-2xl border-2 border-brand/40 bg-brand/5 p-4 sm:p-5">
              <h3 className="text-base font-extrabold text-ink">What should publish on LinkedIn?</h3>
              <p className="mt-1 text-sm text-muted">Choose the swipeable carousel or a single cover image.</p>
              <div role="group" aria-label="LinkedIn image format" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { active: true, label: "Carousel", detail: `${pageCount} swipeable pages`, Icon: GalleryHorizontal },
                  { active: false, label: "Cover image", detail: "One image with your post", Icon: Sparkles },
                ].map(({ active, label, detail, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={carousel.active === active}
                    disabled={busy !== null || carousel.active === active}
                    onClick={() => void send("PATCH", { active }, "toggle")}
                    className={`flex min-h-20 items-center gap-3 rounded-xl border-2 border-b-4 px-4 py-3 text-left transition-all cursor-pointer active:translate-y-1 active:border-b-2 disabled:cursor-default ${carousel.active === active ? "border-brand bg-brand/15 text-ink" : "border-line bg-surface text-muted hover:border-brand/50 hover:text-ink"}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1"><span className="block text-sm font-extrabold">{label}</span><span className="block text-xs">{detail}</span></span>
                    {busy === "toggle" && carousel.active !== active ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving choice" /> : carousel.active === active ? <span className="text-xs font-bold text-brand">Selected</span> : null}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          ) : null}

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
