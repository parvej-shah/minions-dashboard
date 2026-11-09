"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ExternalLink, Image as ImageIcon, Loader2, PenLine, RefreshCw, Shuffle } from "lucide-react";
import type { AssetItem, CoverSpecDTO } from "@/types";
import type { CoverEditInput } from "@/hooks/useEditorialDraft";
import { COVER_ART_STYLES, COVER_ART_STYLE_META } from "@/lib/covers/artStyles";
import { layoutUnavailable } from "@/lib/covers/available";

import { buttonStyles } from "@/components/ui/Button";
export interface CoverImageCardProps {
  activeAsset: AssetItem;
  isRendering: boolean;
  onRerender: (edit?: CoverEditInput) => Promise<string>;
  /** Reads the post's points onto a cover that lacks them; false when it failed. */
  onCheckShape: (assetId: string) => Promise<boolean>;
  onMessage: (message: string) => void;
}

type Layout = CoverSpecDTO["layout"];

const LAYOUTS: { id: Layout; label: string; hint: string }[] = [
  { id: "HEADLINE", label: "Headline", hint: "The headline on a soft gradient" },
  { id: "STATEMENT", label: "Statement", hint: "The headline on a dark glow" },
  { id: "LIST", label: "List", hint: "The post's 3 or 4 points, numbered, on grid paper" },
  { id: "GRID", label: "Grid", hint: "3 to 6 things the post names, as icon tiles on folded paper" },
  { id: "PUNCH", label: "Punch", hint: "Short lines that land one after another, over a colour band" },
  { id: "PHOTO", label: "Photo", hint: "Your headshot large, the headline below" },
  { id: "QUOTE", label: "Quote", hint: "A line taken word for word from the post" },
  { id: "NUMBER", label: "Number", hint: "A figure the draft states, set large" },
  { id: "TORN", label: "Torn", hint: "The headline on a colour field, a torn paper strip revealing the subtitle" },
  { id: "SELECT", label: "Selected", hint: "The key word in a design tool's selection box, your cursor beside it" },
  { id: "STICKER", label: "Sticker", hint: "Tag stickers slapped on the headline, on grid paper" },
  { id: "NOTEBOOK", label: "Notebook", hint: "The headline on a ruled notebook sheet over coloured sheets" },
  { id: "NOTES", label: "Notes", hint: "The headline written in a phone notes card" },
  { id: "POSTCARD", label: "Post card", hint: "The headline as a post by you, on a dark glow (no made-up counts)" },
  { id: "CIRCLED", label: "Circled", hint: "The key word circled by hand, an arrow to the subtitle" },
  { id: "CUTOUT", label: "Cut-out", hint: "Your cut-out photo in front of one giant word" },
];

const hasArt = (layout: Layout) => layout === "HEADLINE" || layout === "STATEMENT";
const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const same = (a: string[], b: string[] | undefined) => a.join("\n") === (b ?? []).join("\n");

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
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand" />
          <span className="text-[17px] font-semibold text-ink">Cover</span>
        </div>
        <span className="text-[10px] font-mono text-subtle">
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
              {activeAsset.hero_error_code && <span className="text-[10px] font-mono text-subtle">{activeAsset.hero_error_code}</span>}
            </div>
          )}
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {isLocked ? (
            <div className="space-y-1.5">
              {cover && <p className="text-sm font-semibold text-ink leading-snug">{cover.layout === "QUOTE" && cover.quote ? `“${cover.quote}”` : cover.headline}</p>}
              <p className="text-xs leading-relaxed text-muted">This draft is published, so its cover stays exactly as it went out.</p>
            </div>
          ) : cover ? (
            <>
              <div>
                <span className="text-[11px] font-medium text-muted block mb-1.5">Layout</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {LAYOUTS.map((l) => {
                    // The current layout is never disabled for a reason: it is already drawn.
                    const why = cover.layout === l.id ? null : layoutUnavailable(l.id, cover, { checking: checking === activeAsset.id });
                    return (
                      // The wrapper carries the tooltip and cursor: a disabled button gets no hover in some browsers.
                      <span key={l.id} title={why ? `Not available: ${why}` : l.hint} className={`flex ${why ? "cursor-not-allowed" : ""}`}>
                        <button
                          type="button"
                          aria-pressed={cover.layout === l.id}
                          aria-label={why ? `${l.label} (not available: ${why})` : l.label}
                          disabled={isRendering || Boolean(why) || cover.layout === l.id}
                          onClick={() => void run({ layout: l.id })}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            cover.layout === l.id
                              ? "bg-brand/15 border-brand text-brand"
                              : "bg-surface-2 border-line text-ink hover:border-brand/60 disabled:opacity-40 disabled:hover:border-line disabled:cursor-not-allowed disabled:line-through"
                          }`}
                        >
                          {l.label}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-muted block mb-1.5">Illustration</span>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_ART_STYLES.map((s) => {
                    const current = (cover.art_style ?? "NONE") === s;
                    const noRoom = !hasArt(cover.layout);
                    return (
                      <button
                        key={s}
                        type="button"
                        title={noRoom ? "Only Headline and Statement covers have an illustration" : COVER_ART_STYLE_META[s].description}
                        aria-pressed={current}
                        disabled={isRendering || current || noRoom}
                        onClick={() => void run({ art: s })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          current
                            ? "bg-brand/15 border-brand text-brand"
                            : "bg-surface-2 border-line text-ink hover:border-brand/60 disabled:opacity-40"
                        }`}
                      >
                        {COVER_ART_STYLE_META[s].label}
                      </button>
                    );
                  })}
                  {cover.art_style && cover.art_style !== "NONE" && cover.art_drawn && (
                    <button
                      type="button"
                      disabled={isRendering}
                      onClick={() => void run({ art_reroll: true })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-surface-2 border-line text-ink hover:border-brand/60 disabled:opacity-40"
                    >
                      <Shuffle className="w-3 h-3" /> Try another
                    </button>
                  )}
                </div>
                {!hasArt(cover.layout) ? (
                  <p className="text-[11px] text-subtle mt-1.5">Only Headline and Statement covers have an illustration. Switch to one of them to add it.</p>
                ) : cover.art_style && cover.art_style !== "NONE" && !cover.art_drawn ? (
                  <p className="text-[11px] text-subtle mt-1.5">Left off on this cover: the headline needed the space. A shorter headline makes room for it.</p>
                ) : null}
              </div>

              {editing ? (
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-[11px] font-medium text-muted block mb-1">
                      {cover.layout === "PUNCH" ? "Lead-in line" : "Headline (6–10 words works best)"}
                    </span>
                    <textarea
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      rows={2}
                      maxLength={160}
                      className="w-full bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-brand resize-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-medium text-muted block mb-1">Accent word</span>
                    <input
                      value={emphasis}
                      onChange={(e) => setEmphasis(e.target.value)}
                      maxLength={40}
                      className="w-full bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </label>
                  {hasArt(cover.layout) && (
                    <label className="block">
                      <span className="text-[11px] font-medium text-muted block mb-1">Subtitle (optional)</span>
                      <textarea
                        value={kicker}
                        onChange={(e) => setKicker(e.target.value)}
                        rows={2}
                        maxLength={160}
                        className="w-full bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-brand resize-none"
                      />
                    </label>
                  )}
                  {(cover.layout === "LIST" || cover.layout === "GRID" || cover.layout === "PUNCH") && (
                    <label className="block">
                      <span className="text-[11px] font-medium text-muted block mb-1">
                        {cover.layout === "LIST"
                          ? "Points, one per line (3–4, 2–6 words each)"
                          : cover.layout === "GRID"
                            ? `Tile labels, one per line (${cover.grid?.length ?? 0}, 1–3 words each)`
                            : "Punch lines, one per line (3–4, up to 5 words; the last is in the accent colour)"}
                      </span>
                      <textarea
                        value={items}
                        onChange={(e) => setItems(e.target.value)}
                        rows={4}
                        maxLength={400}
                        className="w-full bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-brand resize-none"
                      />
                    </label>
                  )}
                  {cover.layout === "PUNCH" && (
                    <label className="block">
                      <span className="text-[11px] font-medium text-muted block mb-1">Checks, one per line (3–4, 2–5 words each)</span>
                      <textarea
                        value={checks}
                        onChange={(e) => setChecks(e.target.value)}
                        rows={4}
                        maxLength={400}
                        className="w-full bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-brand resize-none"
                      />
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isRendering || !headline.trim()}
                      onClick={() => void saveEdit()}
                      className={buttonStyles({ size: "sm" })}
                    >
                      Redraw cover
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-xs text-ink">
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-subtle">A figure the draft does not state is refused, so the cover never claims more than the post.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-ink leading-snug">{cover.layout === "QUOTE" && cover.quote ? `“${cover.quote}”` : cover.headline}</p>
                  {cover.kicker && hasArt(cover.layout) && <p className="text-xs text-muted leading-relaxed">{cover.kicker}</p>}
                  {(() => {
                    const shown = cover.layout === "LIST" ? cover.list : cover.layout === "GRID" ? cover.grid?.map((g) => g.label) : cover.layout === "PUNCH" ? cover.punch?.lines : null;
                    return shown?.length ? (
                      <ul className="text-xs text-muted leading-relaxed list-disc pl-4">
                        {shown.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    ) : null;
                  })()}
                  <button
                    type="button"
                    disabled={isRendering}
                    onClick={startEditing}
                    className="mt-1 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-medium text-brand border border-brand/30 hover:border-brand transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <PenLine className="w-3 h-3" />
                    Edit text
                  </button>
                </div>
              )}

              {cover.notes.length > 0 && !editing && (
                <details className="text-[11px] text-subtle">
                  <summary className="cursor-pointer hover:text-muted">Why this wording ({cover.notes.length})</summary>
                  <ul className="mt-1.5 space-y-1 list-disc pl-4">
                    {cover.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              {activeAsset.hero_image_url
                ? "This cover was made as an AI image. Draw it in code to get the editorial cover you can edit."
                : "Draw this draft's cover in code: portrait, in the brand's type, free."}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {!isLocked && (!cover || coverNeedsAttention) && (
              <button
                type="button"
                disabled={isRendering}
                onClick={() => void run()}
                className="px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-medium text-brand border border-brand/30 hover:border-brand transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Draw cover
              </button>
            )}
            {activeAsset.hero_image_url && (
              <a
                href={activeAsset.hero_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-medium text-muted border border-line hover:border-brand transition-all inline-flex items-center gap-1.5"
                title="Open the full-size cover"
              >
                Full size
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
