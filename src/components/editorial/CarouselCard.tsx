"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, GalleryHorizontal, Loader2, Sparkles } from "lucide-react";
import type { AssetItem } from "@/types";
import type { StoredCarousel } from "@/services/carousel";
import type { CarouselPlan } from "@/lib/carousel/plan";
import type { Slide, SlideStyle } from "@/lib/carousel/slides";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CarouselPdfPages from "./CarouselPdfPages";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { buttonStyles } from "@/components/ui/Button";
import { GroupedList, ListRow } from "@/components/ui/List";
import ThumbPicker from "@/components/ui/ThumbPicker";
import Segmented from "@/components/ui/Segmented";
import { carouselThumb } from "@/lib/covers/pickerThumbs";
import { inputClass } from "@/components/ui/fieldStyles";
import { STYLE_META, styleName } from "@/lib/carousel/styleNames";

const WRITERS_CHOICE = "WRITER";

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
  // The tiles keep their icons, so only the title is edited here.
  GRID: [{ key: "title", label: "Title" }],
  PUNCH: [{ key: "lines", label: "Lines, one per line", long: true }, { key: "checks", label: "Checks, one per line", long: true }],
};

const LAYOUT_NAMES: Record<Slide["layout"], string> = {
  STAKES: "Why it matters", POINT: "Point", STEP: "Step", CONTRAST: "Assumption vs practice", CHECKLIST: "Checklist", NUMBER: "Figure", QUOTE: "Quote", CLOSE: "Close", GRID: "Tiles", PUNCH: "Punch lines",
};

const STYLES = Object.keys(STYLE_META) as SlideStyle[];

const pageClass = "snap-start shrink-0 w-[70%] sm:w-[220px] aspect-[4/5] rounded-lg border border-line object-cover";
const fieldLabel = "mb-1 block text-[13px] text-muted";

/**
 * The draft's LinkedIn carousel (phase 11, D19). Suggested, never automatic:
 * the reviewer makes one, checks every page, edits the words (redrawn with no
 * model call, through the same checks), and decides whether LinkedIn gets the
 * carousel or the cover image. Once the draft is published it is shown as it
 * went out.
 */
export default function CarouselCard({
  activeAsset,
  onMessage,
  onCarouselOn,
}: {
  activeAsset: AssetItem;
  onMessage: (message: string) => void;
  /** Told whether LinkedIn gets the carousel, on load and on every change, so the studio previews what goes out. */
  onCarouselOn?: (on: boolean) => void;
}) {
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState<"make" | "save" | "toggle" | "style" | null>(null);
  // The reviewer's optional choice of design for a new carousel; empty lets the writer choose.
  const [chosenStyle, setChosenStyle] = useState<SlideStyle | "">("");
  const [errors, setErrors] = useState<string[]>([]);
  const [draft, setDraft] = useState<CarouselPlan | null>(null);
  const [confirmRemake, setConfirmRemake] = useState(false);
  // The design being drawn, and the one before the last pick (for Undo).
  const [pendingStyle, setPendingStyle] = useState<SlideStyle | null>(null);
  const [previousStyle, setPreviousStyle] = useState<SlideStyle | null>(null);
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

  const carouselOn = state ? Boolean(state.carousel?.active) : null;
  useEffect(() => {
    if (carouselOn !== null) onCarouselOn?.(carouselOn);
    // Only a change of the choice is news; the callback is a new function each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselOn]);

  const send = async (method: "POST" | "PATCH", body: unknown, kind: "make" | "save" | "toggle" | "style"): Promise<boolean> => {
    setBusy(kind);
    setErrors([]);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        setState((s) => (s ? { ...s, carousel: json.carousel } : s));
        setDraft(null);
        if (kind !== "style") setPreviousStyle(null);
        onMessage(kind === "make" ? "Carousel ready. Check every page." : kind === "save" ? "Carousel redrawn." : kind === "style" ? `Carousel redrawn in ${styleName(json.carousel.plan.style)}.` : json.carousel.active ? "LinkedIn will post the carousel." : "LinkedIn will post the cover image.");
        return true;
      } else {
        setErrors(json.errors?.length ? json.errors : []);
        onMessage(json.error ?? "The carousel could not be updated.");
      }
      return false;
    } catch {
      onMessage("The carousel could not be updated. Check your connection and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  if (!state && loadError) return (
    <div className="rounded-[28px] bg-surface shadow-soft p-6 sm:p-8">
      <p className="font-semibold text-ink">Could not load the LinkedIn carousel</p>
      <button type="button" onClick={() => { setLoadError(false); setLoadAttempt((n) => n + 1); }} className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-brand/40 px-4 text-sm font-bold text-brand cursor-pointer hover:bg-brand/10">Try again</button>
    </div>
  );
  if (!state) return (
    <SkeletonGroup label="Loading LinkedIn carousel" className="space-y-4 rounded-[28px] bg-surface shadow-soft p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-line pb-3"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-16" /></div>
      <div className="space-y-3 rounded-2xl bg-surface-2 p-4">
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
      const slides = d.slides.map((s, j) => (j === i ? ({ ...s, [key]: key === "items" || key === "lines" || key === "checks" ? value.split("\n") : value } as Slide) : s));
      return { ...d, slides };
    });

  const saveEdit = () => {
    if (!draft) return;
    const clean = { ...draft, slides: draft.slides.map((s) => (s.layout === "CHECKLIST" ? { ...s, items: s.items.map((x) => x.trim()).filter(Boolean) } : s)) };
    void send("PATCH", { plan: clean }, "save");
  };

  const currentStyle = (carousel?.plan.style ?? "EDITORIAL") as SlideStyle;
  const pickStyle = async (k: SlideStyle, undo = false) => {
    if (!carousel) return setChosenStyle(k);
    const from = currentStyle;
    setPendingStyle(k);
    const ok = await send("PATCH", { plan: { ...carousel.plan, style: k } }, "style").finally(() => setPendingStyle(null));
    if (ok) setPreviousStyle(undo ? null : from);
  };
  const undoStyle = carousel && previousStyle && previousStyle !== currentStyle ? previousStyle : null;

  // The designs as pictures, used before and after the carousel is made.
  const designPicker = (
    <div className="min-w-0 space-y-2">
      <div className="flex items-baseline justify-between gap-3 px-1 text-[13px]">
        <span className="text-muted">Design</span>
        {undoStyle && (
          <button type="button" disabled={busy !== null} onClick={() => void pickStyle(undoStyle, true)} className="text-brand hover:underline disabled:opacity-50">
            Undo
          </button>
        )}
      </div>
      <ThumbPicker
        label="Carousel design"
        size="wide"
        options={[
          ...(carousel ? [] : [{ id: WRITERS_CHOICE, label: "Writer's choice", icon: <Sparkles className="h-6 w-6" aria-hidden="true" /> }]),
          ...STYLES.map((k) => ({ id: k, label: STYLE_META[k].name, src: carouselThumb(k) })),
        ]}
        selected={pendingStyle ?? (carousel ? currentStyle : chosenStyle || WRITERS_CHOICE)}
        busy={pendingStyle}
        disabled={busy !== null}
        onSelect={(id) => (id === WRITERS_CHOICE ? setChosenStyle("") : void pickStyle(id as SlideStyle))}
      />
      <p className="px-1 text-[13px] text-subtle">{carousel ? "Same words, redrawn at once." : chosenStyle ? STYLE_META[chosenStyle].hint : "The writer picks the design that suits the draft."}</p>
    </div>
  );

  return (
    <div className="rounded-[28px] bg-surface shadow-soft p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-line/60">
        <div className="flex items-center gap-2">
          <GalleryHorizontal className="w-4 h-4 text-brand" aria-hidden="true" />
          <span className="text-[17px] font-semibold text-ink">LinkedIn carousel</span>
        </div>
        <span className="text-[13px] text-muted">
          {busy === "make" ? "Writing the slides…" : carousel ? `${pageCount} pages` : suggested.yes ? "Suggested" : "Optional"}
        </span>
      </div>

      {!carousel ? (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed text-muted">
            {suggested.reason} A carousel is a swipeable PDF on LinkedIn, drawn in your brand. It says only what this draft says.
          </p>
          {locked ? (
            <p className="text-[13px] text-subtle">This draft is published without a carousel.</p>
          ) : (
            <>
              {designPicker}
              <button type="button" disabled={busy !== null} onClick={() => void send("POST", chosenStyle ? { style: chosenStyle } : null, "make")} className={buttonStyles({ block: true })}>
                {busy === "make" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                {busy === "make" ? "Writing the slides, about a minute" : "Make carousel"}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* A second post that exists to share the carousel has no choice to make. */}
          {!locked && activeAsset.follow_up_format !== "CAROUSEL" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[15px] text-ink">
                Post on LinkedIn
                {busy === "toggle" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-label="Saving choice" />}
              </span>
              <Segmented
                label="LinkedIn image format"
                value={carousel.active ? "CAROUSEL" : "COVER"}
                disabled={busy !== null}
                onChange={(v) => void send("PATCH", { active: v === "CAROUSEL" }, "toggle")}
                options={[{ id: "CAROUSEL", label: `Carousel · ${pageCount}` }, { id: "COVER", label: "Cover image" }]}
              />
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
            <p className="text-[13px] leading-relaxed text-muted">
              This draft is published, so its carousel stays exactly as it went out{carousel.active ? "" : " (LinkedIn got the cover image)"}.
            </p>
          ) : null}

          {draft ? (
            <div className="space-y-4">
              <div className="space-y-3 rounded-2xl bg-surface-2 p-4">
                <span className="block text-[13px] text-muted">Cover</span>
                <label className="block">
                  <span className={fieldLabel}>Headline</span>
                  <input className={inputClass} value={draft.cover.headline} onChange={(e) => setDraft({ ...draft, cover: { ...draft.cover, headline: e.target.value } })} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Subtitle</span>
                  <input className={inputClass} value={draft.cover.kicker ?? ""} onChange={(e) => setDraft({ ...draft, cover: { ...draft.cover, kicker: e.target.value } })} />
                </label>
              </div>
              {draft.slides.map((slide, i) => (
                <fieldset key={i} className="space-y-3 rounded-2xl bg-surface-2 p-4">
                  <legend className="float-left mb-1 w-full text-[13px] text-muted">
                    Page {i + 2} · {LAYOUT_NAMES[slide.layout]}
                  </legend>
                  {FIELDS[slide.layout].map((f) => {
                    const raw = (slide as unknown as Record<string, unknown>)[f.key];
                    const value = Array.isArray(raw) ? raw.join("\n") : typeof raw === "string" ? raw : "";
                    return (
                      <label key={f.key} className="block clear-left">
                        <span className={fieldLabel}>{f.label}</span>
                        {f.long ? (
                          <textarea rows={f.key === "items" ? 4 : 2} className={`${inputClass} resize-none`} value={value} onChange={(e) => setSlide(i, f.key, e.target.value)} />
                        ) : (
                          <input className={inputClass} value={value} onChange={(e) => setSlide(i, f.key, e.target.value)} />
                        )}
                      </label>
                    );
                  })}
                </fieldset>
              ))}
              <div className="space-y-3 rounded-2xl bg-surface-2 p-4">
                <label className="block">
                  <span className={fieldLabel}>Post text above the carousel</span>
                  <textarea rows={6} className={`${inputClass} resize-none`} value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Document title (shown on LinkedIn)</span>
                  <input className={inputClass} value={draft.documentTitle} onChange={(e) => setDraft({ ...draft, documentTitle: e.target.value })} />
                </label>
              </div>
              <p className="px-4 text-[13px] leading-snug text-subtle">Edits pass the same checks: word limits, every page fits, and no figure the draft does not state.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy !== null} onClick={saveEdit} className={buttonStyles({ size: "sm" })}>
                  {busy === "save" && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  Redraw carousel
                </button>
                <button type="button" onClick={() => { setDraft(null); setErrors([]); }} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {!locked && designPicker}
              <GroupedList header="Post text with the carousel">
                <p className="px-4 py-3 text-[15px] leading-relaxed text-ink whitespace-pre-line break-words">{carousel.caption}</p>
              </GroupedList>
              <GroupedList>
                {!locked && (
                  <>
                    <ListRow label="Edit wording" onClick={() => setDraft(structuredClone(carousel.plan))} disabled={busy !== null} />
                    <ListRow
                      label={busy === "make" ? "Writing the slides…" : "Make again"}
                      hint="Writes new slides from the draft"
                      onClick={() => setConfirmRemake(true)}
                      disabled={busy !== null}
                    />
                  </>
                )}
                <ListRow label="Open PDF" href={carousel.pdf_url} />
              </GroupedList>
            </div>
          )}
        </>
      )}

      {errors.length > 0 && (
        <div className="rounded-2xl bg-gold/10 p-4 space-y-1.5">
          <span className="text-[13px] font-semibold text-gold inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Not saved. Fix these:
          </span>
          <ul className="list-disc pl-4 space-y-0.5 text-[13px] leading-relaxed text-ink">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmRemake}
        title="Make the carousel again?"
        description="The slides are written again from the draft in the same design, and any edits you made to this carousel are replaced."
        confirmLabel="Make again"
        cancelLabel="Keep this one"
        variant="warning"
        isLoading={false}
        onConfirm={() => {
          setConfirmRemake(false);
          void send("POST", carousel ? { style: carousel.plan.style } : null, "make");
        }}
        onClose={() => setConfirmRemake(false)}
      />
    </div>
  );
}
