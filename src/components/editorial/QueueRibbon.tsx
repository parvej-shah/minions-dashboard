"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import type { AssetItem } from "@/types";
import { statusLabel } from "@/lib/drafts/statusLabel";
import { formatDate } from "@/utils/date";
import { queueFor, type QueueFilter } from "@/lib/drafts/queue";

import { segment } from "@/components/ui/segment";
export type { QueueFilter };

export interface QueueRibbonProps {
  assets: AssetItem[];
  activeAsset: AssetItem;
  listFilter: QueueFilter;
  setListFilter: (filter: QueueFilter) => void;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  /** Shown at the right of the header on every screen size. */
  action?: React.ReactNode;
}

/** The horizontal review-queue rail and its filter pills. */
export default function QueueRibbon({
  assets,
  activeAsset,
  listFilter,
  setListFilter,
  onSelect,
  onPrev,
  onNext,
  action,
}: QueueRibbonProps) {
  const pendingCount = assets.filter((a) => a.status === "PENDING_REVIEW").length;
  const unpublishedCount = assets.filter((a) => a.status === "UNPUBLISHED").length;
  const scheduledCount = assets.filter((a) => a.status === "SCHEDULED").length;
  /**
   * Drafts whose post is already on the blog while the asset still reads
   * PENDING_REVIEW. Republishing these duplicates the broadcast, so they are
   * called out rather than left looking like fresh drafts.
   */
  const liveButUnreviewedCount = assets.filter(
    (a) => Boolean(a.live_blog_url) && a.status !== "PUBLISHED"
  ).length;

  const queueAssets = queueFor(assets, listFilter);
  const publishedCount = assets.filter((a) => a.status === "PUBLISHED").length;
  // The arrows step through the drafts this filter shows; with one there is nothing to step through.
  const currentAssetIndex = queueAssets.findIndex((a) => a.id === activeAsset.id);
  const showStepper = queueAssets.length > 1;
  const pill = (filter: QueueFilter, label: string) => (
    <button
      onClick={() => setListFilter(filter)}
      className={`px-2.5 py-2 sm:py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${listFilter === filter ? segment.on : segment.off}`}
    >
      {label}
    </button>
  );
  const stepper = (
    <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-line">
      <button
        onClick={onPrev}
        title="Previous draft (key: [ )"
        aria-label="Previous draft"
        className="min-h-9 min-w-9 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-all flex items-center justify-center cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="whitespace-nowrap px-1.5 text-[11px] font-bold text-brand tabular-nums select-none">
        {currentAssetIndex >= 0 ? `${currentAssetIndex + 1} / ${queueAssets.length}` : `${queueAssets.length} left`}
      </span>
      <button
        onClick={onNext}
        title="Next draft (key: ] )"
        aria-label="Next draft"
        className="min-h-9 min-w-9 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-all flex items-center justify-center cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
  <div className="bg-surface rounded-2xl border border-line p-3 sm:p-4 space-y-3">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-line/60 pb-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
        <h2 className="text-sm font-extrabold text-ink">Your drafts</h2>

        <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-line max-w-full overflow-x-auto whitespace-nowrap no-scrollbar">
          {pill("PENDING_REVIEW", `To review (${pendingCount})`)}
          {scheduledCount > 0 && pill("SCHEDULED", `Scheduled (${scheduledCount})`)}
          {pill("PUBLISHED", `Published (${publishedCount})`)}
          {unpublishedCount > 0 && pill("UNPUBLISHED", `Taken down (${unpublishedCount})`)}
          {pill("ALL", `All (${assets.length})`)}
          {liveButUnreviewedCount > 0 && (
            <span
              className="px-2.5 py-2 sm:py-1 text-xs font-medium rounded-lg text-gold bg-gold/10 border border-gold/30 cursor-default"
              title="Already on the blog but still waiting for review. Publishing again posts it twice."
            >
              Already live ({liveButUnreviewedCount})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {action}
        {showStepper && <div className="hidden sm:block">{stepper}</div>}
      </div>
    </div>

    {/* Horizontal Queue Card Rail (Tactile 1-Click Draft Switcher with Auto-Spotlight Scroll) */}
    {queueAssets.length === 0 ? (
      <p className="py-2 text-sm text-muted">
        {listFilter === "PENDING_REVIEW" ? "Nothing waiting for review. New drafts show up here." : "Nothing here yet."}
      </p>
    ) : (
      pendingCount === 0 && listFilter === "ALL" && (
        <p className="text-xs text-muted">Nothing waiting for review. New drafts show up here.</p>
      )
    )}

    <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
      {queueAssets.map((asset) => {
        const isCurrent = asset.id === activeAsset.id;
        // Live on the blog but still sitting in the review queue.
        const alreadyLive = Boolean(asset.live_blog_url) && asset.status !== "PUBLISHED";
        return (
          <button
            key={asset.id}
            id={`queue-card-${asset.id}`}
            onClick={() => onSelect(asset.id)}
            className={`flex items-center gap-3 p-2.5 px-3 rounded-xl border text-left shrink-0 transition-all duration-200 cursor-pointer min-w-[220px] max-w-[290px] sm:min-w-[250px] relative ${
              isCurrent
                ? "bg-surface-2 border-brand shadow-lg shadow-brand/20 ring-2 ring-brand scale-[1.02] z-10 opacity-100"
                : "bg-canvas border-line hover:border-line-strong hover:bg-surface-2/70 opacity-65 hover:opacity-100"
            }`}
          >
            {/* Micro Thumbnail */}
            <div className={`w-9 h-9 rounded-lg overflow-hidden bg-surface-2 border shrink-0 flex items-center justify-center transition-all ${
              isCurrent ? "border-brand ring-1 ring-brand/50" : "border-line"
            }`}>
              {asset.hero_image_url ? (
                <Image
                  src={asset.hero_image_url}
                  alt={asset.title}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-subtle" />
              )}
            </div>

            {/* Info block */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
                    asset.status === "PUBLISHED"
                      ? "bg-brand/15 text-brand"
                      : alreadyLive
                        ? "bg-gold/20 text-gold"
                        : asset.status === "PENDING_REVIEW"
                          ? "bg-gold/15 text-gold"
                          : asset.status === "SCHEDULED"
                            ? "bg-brand/20 text-brand"
                            : "bg-subtle/20 text-muted"
                  }`}
                >
                  {alreadyLive ? "Already live" : statusLabel(asset.status)}
                </span>
                <span className="text-[10px] text-subtle whitespace-nowrap">
                  {formatDate(asset.status === "PUBLISHED" ? asset.linkedin_published_at ?? asset.published_at : asset.created_at)}
                </span>
              </div>

              <div className={`text-xs font-semibold line-clamp-2 break-words ${isCurrent ? "text-ink font-bold" : "text-ink"}`}>
                {asset.title}
              </div>

            </div>
          </button>
        );
      })}
    </div>

    {showStepper && <div className="flex justify-end border-t border-line/60 pt-2 sm:hidden">{stepper}</div>}
  </div>
  );
}
