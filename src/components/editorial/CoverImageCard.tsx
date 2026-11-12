"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Image as ImageIcon, Loader2, RefreshCw, Shuffle } from "lucide-react";
import type { AssetItem, CoverSpecDTO } from "@/types";
import type { CoverEditInput } from "@/hooks/useEditorialDraft";
import { COVER_ART_STYLES, COVER_ART_STYLE_META, parseArtStyle } from "@/lib/covers/artStyles";
import { coverPreviewUrl, coverThumb, pickerLayouts, previewVersion } from "@/lib/covers/pickerThumbs";
import { buttonStyles } from "@/components/ui/Button";
import { ChoiceRow, GroupedList, ListRow } from "@/components/ui/List";
import { inputClass } from "@/components/ui/fieldStyles";
import ThumbPicker from "@/components/ui/ThumbPicker";

export interface CoverImageCardProps {
  activeAsset: AssetItem;
  isRendering: boolean;
  onRerender: (edit?: CoverEditInput) => Promise<string>;
  /** Reads the post's points onto a cover that lacks them; false when it failed. */
  onCheckShape: (assetId: string) => Promise<boolean>;
  onMessage: (message: string) => void;
}

type Layout = CoverSpecDTO["layout"];

const LAYOUT_NAMES: Record<Layout, string> = {
  HEADLINE: "Headline",
  STATEMENT: "Statement",
  LIST: "List",
  GRID: "Grid",
  PUNCH: "Punch",
  PHOTO: "Photo",
  QUOTE: "Quote",
  NUMBER: "Number",
  TORN: "Torn",
  SELECT: "Selected",
  STICKER: "Sticker",
  NOTEBOOK: "Notebook",
  NOTES: "Notes",
  POSTCARD: "Post card",
  CIRCLED: "Circled",
  CUTOUT: "Cut-out",
  HIGHLIGHT: "Highlight",
  SWISS: "Swiss",
  SIDEWAYS: "Sideways",
  ECHO: "Echo",
  BOLD: "Bold",
  SPLIT: "Split",
  MAGAZINE: "Magazine",
  BENTO: "Bento",
  TAGGED: "Tagged",
  NEON: "Neon",
};

const hasArt = (layout: Layout) => layout === "HEADLINE" || layout === "STATEMENT";
const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const same = (a: string[], b: string[] | undefined) => a.join("\n") === (b ?? []).join("\n");
const layoutLabel = (layout: Layout) => LAYOUT_NAMES[layout] ?? layout;
/** The points a List, Grid or Punch cover shows, for the Text row. */
const shownItems = (cover: CoverSpecDTO) =>
  cover.layout === "LIST" ? cover.list : cover.layout === "GRID" ? cover.grid?.map((g) => g.label) : cover.layout === "PUNCH" ? cover.punch?.lines : null;
const fieldLabel = "block text-[13px] text-muted";

/**
 * The draft's cover. Covers are drawn in code (phase 5): portrait
 * 1080x1350, every letter set in the brand's type, so the headline is always
 * spelled right and a reviewer can change the layout or wording and see it
 * re-drawn in a second, with no model call. Older drafts may carry a 16:9 AI
 * image cover; those are shown as they are.
 */
export default function CoverImageCard({ activeAsset, isRendering, onRerender, onCheckShape, onMessage }: CoverImageCardProps) {
  const cover = activeAsset.cover;
  const isTemplate = activeAsset.hero_provider === "template";
  // Once a post is out, its cover is the file the post points at: it can no longer be redrawn.
  const isLocked = activeAsset.status === "PUBLISHED" || Boolean(activeAsset.published_at || activeAsset.live_blog_url);
  const isCoverPending = activeAsset.hero_status === "PENDING";
  const coverNeedsAttention = !isCoverPending && activeAsset.hero_status !== "READY";
  const coverMessage = activeAsset.hero_status === "BLOCKED_BY_SAFETY"
    ? "Qwen's safety filter blocked this cover. The draft is ready for review."
    : "The cover could not be drawn. The draft is ready for review.";

  const [editing, setEditing] = useState(false);
  // Which row's choices are open below the list.
  const [open, setOpen] = useState<"art" | null>(null);
  // Every layout, or only the few that suit this post.
  const [showAll, setShowAll] = useState(false);
  // The layout being drawn, and the one before the last pick (for Undo), per draft.
  const [pending, setPending] = useState<Layout | null>(null);
  const [previous, setPrevious] = useState<{ id: string; layout: Layout } | null>(null);
  const [headline, setHeadline] = useState("");
  const [kicker, setKicker] = useState("");
  const [emphasis, setEmphasis] = useState("");
  const [items, setItems] = useState("");
  const [checks, setChecks] = useState("");

  // A cover drawn before the post's points were read: read them once, so
  // List, Grid and Punch are enabled only when the post really has them.
  const tried = useRef(new Set<string>());
  const [checking, setChecking] = useState<string | null>(null);
  const needsCheck = Boolean(cover && !cover.shape_read && !isLocked);
  useEffect(() => {
    const id = activeAsset.id;
    if (!needsCheck || tried.current.has(id)) return;
    tried.current.add(id);
    setChecking(id);
    void onCheckShape(id).finally(() => setChecking((c) => (c === id ? null : c)));
  }, [activeAsset.id, needsCheck, onCheckShape]);

  const run = async (edit?: CoverEditInput) => {
    const message = await onRerender(edit);
    if (message) onMessage(message);
    return message;
  };

  const pickLayout = async (layout: Layout, undo = false) => {
    if (!cover) return;
    const from = cover.layout;
    setPending(layout);
    const message = await run({ layout }).finally(() => setPending(null));
    if (message.startsWith("Cover updated")) setPrevious(undo ? null : { id: activeAsset.id, layout: from });
  };
  const undoLayout = previous?.id === activeAsset.id && previous.layout !== cover?.layout ? previous.layout : null;
  const layouts = cover ? pickerLayouts(cover.layout, cover, { checking: checking === activeAsset.id }) : null;

  const startEditing = () => {
    setHeadline(cover?.headline ?? activeAsset.title);
    setKicker(cover?.kicker ?? "");
    setEmphasis(cover?.emphasis ?? "");
    const layout = cover?.layout;
    setItems((layout === "LIST" ? cover?.list : layout === "GRID" ? cover?.grid?.map((g) => g.label) : layout === "PUNCH" ? cover?.punch?.lines : null)?.join("\n") ?? "");
    setChecks(layout === "PUNCH" ? (cover?.punch?.checks ?? []).join("\n") : "");
    setEditing(true);
  };

  const saveEdit = async () => {
    const edit: CoverEditInput = { headline, kicker, emphasis };
    // Only a changed list is sent, so an untouched one is not re-checked.
    if (cover?.layout === "LIST" && !same(lines(items), cover.list ?? undefined)) edit.list = lines(items);
    if (cover?.layout === "GRID" && !same(lines(items), cover.grid?.map((g) => g.label))) edit.grid_labels = lines(items);
    if (cover?.layout === "PUNCH" && (!same(lines(items), cover.punch?.lines) || !same(lines(checks), cover.punch?.checks))) {
      edit.punch = { lines: lines(items), checks: lines(checks) };
    }
    const message = await run(edit);
    if (message.startsWith("Cover updated")) setEditing(false);
  };

  return (
    <div id="cover-image" className="scroll-mt-24 rounded-[28px] bg-surface shadow-soft p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand" />
          <span className="text-[17px] font-semibold text-ink">Cover</span>
        </div>
        <span className="text-[13px] text-subtle">
          {isRendering ? "Drawing…" : isCoverPending ? "Drawing…" : coverNeedsAttention ? "Cover needs attention" : isTemplate ? "Portrait · 1080×1350" : "AI image · 1280×720"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div
          className={`relative self-start rounded-xl overflow-hidden border border-line bg-canvas shadow-inner shrink-0 ${
            isTemplate || !activeAsset.hero_image_url ? "aspect-[4/5] w-full sm:w-[280px]" : "aspect-[16/9] w-full"
          }`}
        >
          {activeAsset.hero_image_url ? (
            <Image
              src={activeAsset.hero_image_url}
              alt={cover?.headline ?? activeAsset.title}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 280px"
              className={`object-contain transition-opacity ${isRendering ? "opacity-40" : ""}`}
            />
          ) : isCoverPending ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
              <span className="text-sm font-semibold text-ink">Drawing the cover</span>
              <span className="text-xs leading-relaxed text-muted">It appears here on its own in a few seconds.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <AlertTriangle className="w-8 h-8 text-gold" />
              <span className="text-sm font-semibold text-ink">Cover needs attention</span>
              <span className="text-xs leading-relaxed text-muted">{coverMessage}</span>
              {activeAsset.hero_error_code && <span className="text-[13px] text-subtle">{activeAsset.hero_error_code}</span>}
            </div>
          )}
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {isLocked ? (
            <GroupedList footer="This post is out, so its cover stays exactly as it went out.">
              {cover && <ListRow label={cover.layout === "QUOTE" && cover.quote ? `“${cover.quote}”` : cover.headline} value={layoutLabel(cover.layout)} />}
            </GroupedList>
          ) : cover ? (
            <>
              <GroupedList>
                <ListRow
                  label="Illustration"
                  value={hasArt(cover.layout) ? COVER_ART_STYLE_META[parseArtStyle(cover.art_style) ?? "NONE"].label : "None"}
                  hint={!hasArt(cover.layout) ? "Only on Headline and Statement covers" : cover.art_style && cover.art_style !== "NONE" && !cover.art_drawn ? "Left off: the headline needed the space. A shorter headline makes room." : undefined}
                  onClick={hasArt(cover.layout) ? () => setOpen(open === "art" ? null : "art") : undefined}
                  expanded={open === "art"}
                  disabled={isRendering}
                />
                {!editing && (
                  <ListRow
                    label="Text"
                    hint={
                      <>
                        {cover.layout === "QUOTE" && cover.quote ? `“${cover.quote}”` : cover.headline}
                        {cover.kicker && hasArt(cover.layout) && <span className="block">{cover.kicker}</span>}
                        {shownItems(cover)?.map((t) => <span key={t} className="block">· {t}</span>)}
                      </>
                    }
                    value="Edit"
                    onClick={() => { setOpen(null); startEditing(); }}
                    disabled={isRendering}
                  />
                )}
              </GroupedList>

              {open === "art" && hasArt(cover.layout) && (
                <GroupedList role="radiogroup" aria-label="Illustration" header="Choose an illustration">
                  {COVER_ART_STYLES.map((s) => (
                    <ChoiceRow
                      key={s}
                      label={COVER_ART_STYLE_META[s].label}
                      hint={COVER_ART_STYLE_META[s].description}
                      selected={(cover.art_style ?? "NONE") === s}
                      disabled={isRendering}
                      onSelect={() => void run({ art: s })}
                    />
                  ))}
                  {cover.art_style && cover.art_style !== "NONE" && cover.art_drawn && (
                    <ListRow label={<span className="inline-flex items-center gap-2 text-brand"><Shuffle className="h-4 w-4" aria-hidden="true" /> Try another</span>} trailing={<span />} onClick={() => void run({ art_reroll: true })} disabled={isRendering} />
                  )}
                </GroupedList>
              )}

              {editing && (
                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className={fieldLabel}>{cover.layout === "PUNCH" ? "Lead-in line" : "Headline (6–10 words works best)"}</span>
                    <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} rows={2} maxLength={160} className={`${inputClass} resize-none`} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className={fieldLabel}>Accent word</span>
                    <input value={emphasis} onChange={(e) => setEmphasis(e.target.value)} maxLength={40} className={inputClass} />
                  </label>
                  {hasArt(cover.layout) && (
                    <label className="block space-y-1.5">
                      <span className={fieldLabel}>Subtitle (optional)</span>
                      <textarea value={kicker} onChange={(e) => setKicker(e.target.value)} rows={2} maxLength={160} className={`${inputClass} resize-none`} />
                    </label>
                  )}
                  {(cover.layout === "LIST" || cover.layout === "GRID" || cover.layout === "PUNCH") && (
                    <label className="block space-y-1.5">
                      <span className={fieldLabel}>
                        {cover.layout === "LIST"
                          ? "Points, one per line (3–4, 2–6 words each)"
                          : cover.layout === "GRID"
                            ? `Tile labels, one per line (${cover.grid?.length ?? 0}, 1–3 words each)`
                            : "Punch lines, one per line (3–4, up to 5 words; the last is in the accent colour)"}
                      </span>
                      <textarea value={items} onChange={(e) => setItems(e.target.value)} rows={4} maxLength={400} className={`${inputClass} resize-none`} />
                    </label>
                  )}
                  {cover.layout === "PUNCH" && (
                    <label className="block space-y-1.5">
                      <span className={fieldLabel}>Checks, one per line (3–4, 2–5 words each)</span>
                      <textarea value={checks} onChange={(e) => setChecks(e.target.value)} rows={4} maxLength={400} className={`${inputClass} resize-none`} />
                    </label>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={isRendering || !headline.trim()} onClick={() => void saveEdit()} className={buttonStyles({ size: "sm" })}>
                      Redraw cover
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                      Cancel
                    </button>
                  </div>
                  <p className="text-[13px] leading-snug text-subtle">A figure the draft does not state is refused, so the cover never claims more than the post.</p>
                </div>
              )}

              {cover.notes.length > 0 && !editing && (
                <details className="group px-4 text-[13px] text-subtle">
                  <summary className="cursor-pointer list-none hover:text-muted [&::-webkit-details-marker]:hidden">
                    <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
                    Why this wording ({cover.notes.length})
                  </summary>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {cover.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-muted">
              {activeAsset.hero_image_url
                ? "This cover was made as an AI image. Draw it in code to get the editorial cover you can edit."
                : "Draw this draft's cover in code: portrait, in the brand's type, free."}
            </p>
          )}

          {((!isLocked && (!cover || coverNeedsAttention)) || activeAsset.hero_image_url) && (
            <div className="flex flex-wrap gap-2">
              {!isLocked && (!cover || coverNeedsAttention) && (
                <button type="button" disabled={isRendering} onClick={() => void run()} className={buttonStyles({ variant: "soft", size: "sm" })}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Draw cover
                </button>
              )}
              {activeAsset.hero_image_url && (
                <a href={activeAsset.hero_image_url} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "ghost", size: "sm" })} title="Open the full-size cover">
                  Full size ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {!isLocked && cover && layouts && (
        <div className="min-w-0 space-y-2">
          <div className="flex items-baseline justify-between gap-3 px-1 text-[13px]">
            <span className="text-muted">{showAll ? "All layouts" : "Layouts for this post"}</span>
            <span className="flex items-baseline gap-4">
              {undoLayout && (
                <button type="button" disabled={isRendering} onClick={() => void pickLayout(undoLayout, true)} className="text-brand hover:underline disabled:opacity-50">
                  Undo
                </button>
              )}
              {layouts.rest.length > 0 && (
                <button type="button" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)} className="text-brand hover:underline">
                  {showAll ? "Fewer" : `See all ${layouts.suggested.length + layouts.rest.length}`}
                </button>
              )}
            </span>
          </div>
          <ThumbPicker
            label="Layout"
            options={(showAll ? [...layouts.suggested, ...layouts.rest] : layouts.suggested).map((l) => ({ id: l, label: layoutLabel(l), src: coverThumb(l), liveSrc: coverPreviewUrl(activeAsset.id, l, previewVersion(cover)) }))}
            selected={pending ?? cover.layout}
            busy={pending}
            disabled={isRendering}
            wrap={showAll}
            onSelect={(id) => void pickLayout(id as Layout)}
          />
          {checking === activeAsset.id && <p className="px-1 text-[13px] text-subtle">Checking the post&apos;s points for more layouts…</p>}
        </div>
      )}
    </div>
  );
}
