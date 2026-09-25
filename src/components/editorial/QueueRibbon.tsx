"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Layers } from "lucide-react";
import type { AssetItem } from "@/types";

export type QueueFilter = "ALL" | "PENDING_REVIEW" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED" | "DRAFT";

export interface QueueRibbonProps {
  assets: AssetItem[];
  activeAsset: AssetItem;
  listFilter: QueueFilter;
  setListFilter: (filter: QueueFilter) => void;
  currentAssetIndex: number;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

/** The horizontal review-queue rail and its filter pills. */
export default function QueueRibbon({
  assets,
  activeAsset,
  listFilter,
  setListFilter,
  currentAssetIndex,
  onSelect,
  onPrev,
  onNext,
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

  const queueAssets =
    listFilter === "ALL" || listFilter === "DRAFT"
      ? assets
      : assets.filter((a) => a.status === listFilter);

  return (
  <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 space-y-3 shadow-xl">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D]/60 pb-3">
      
      {/* Left: Queue Title & Status Pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00C9A7]" />
          <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider font-mono">
            Editorial Review Queue
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D] flex-wrap">
          <button
            onClick={() => setListFilter("PENDING_REVIEW")}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              listFilter === "PENDING_REVIEW"
                ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            Needs Review ({pendingCount})
          </button>
          <button
            onClick={() => setListFilter("ALL")}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              listFilter === "ALL"
                ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            All Drafts ({assets.length})
          </button>
          {scheduledCount > 0 && (
            <button
              onClick={() => setListFilter("SCHEDULED")}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                listFilter === "SCHEDULED"
                  ? "bg-[#3B82F6] text-[#070B0F] font-bold shadow-sm"
                  : "text-[#93C5FD] hover:bg-[#161D26]"
              }`}
            >
              Scheduled ({scheduledCount})
            </button>
          )}
          <button
            onClick={() => setListFilter("PUBLISHED")}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              listFilter === "PUBLISHED"
                ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            Published ({assets.filter(a => a.status === "PUBLISHED").length})
          </button>
          {liveButUnreviewedCount > 0 && (
            <span
              className="px-2.5 py-0.5 text-xs font-medium rounded-lg text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 cursor-default"
              title="Already on the blog but still marked PENDING_REVIEW — publishing again duplicates the broadcast"
            >
              Live · Unreviewed ({liveButUnreviewedCount})
            </span>
          )}
          {unpublishedCount > 0 && (
            <button
              onClick={() => setListFilter("UNPUBLISHED")}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                listFilter === "UNPUBLISHED"
                  ? "bg-[#F59E0B] text-[#070B0F] font-bold shadow-sm"
                  : "text-[#F59E0B] hover:bg-[#161D26]"
              }`}
            >
              Offline ({unpublishedCount})
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick Sequential Navigation */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <div className="flex items-center gap-1 bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D]">
          <button
            onClick={onPrev}
            title="Previous Draft (Key: [ )"
            className="px-3 py-2 sm:px-2 sm:py-1 rounded-lg text-xs font-bold text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="px-2 text-[11px] font-mono font-bold text-[#00C9A7] select-none">
            {currentAssetIndex + 1} / {assets.length}
          </span>

          <button
            onClick={onNext}
            title="Next Draft (Key: ] )"
            className="px-3 py-2 sm:px-2 sm:py-1 rounded-lg text-xs font-bold text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>

    {/* Horizontal Queue Card Rail (Tactile 1-Click Draft Switcher with Auto-Spotlight Scroll) */}
    <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
      {queueAssets.map((asset, idx) => {
        const isCurrent = asset.id === activeAsset.id;
        // Live on the blog but still sitting in the review queue.
        const alreadyLive = Boolean(asset.live_blog_url) && asset.status !== "PUBLISHED";
        return (
          <button
            key={asset.id}
            id={`queue-card-${asset.id}`}
            onClick={() => onSelect(asset.id)}
            className={`flex items-center gap-3 p-2.5 px-3 rounded-xl border text-left shrink-0 transition-all duration-200 cursor-pointer min-w-[250px] max-w-[290px] relative ${
              isCurrent
                ? "bg-[#161D26] border-[#00C9A7] shadow-lg shadow-[#00C9A7]/20 ring-2 ring-[#00C9A7] scale-[1.02] z-10 opacity-100"
                : "bg-[#070B0F] border-[#1F2D3D] hover:border-[#2A3D52] hover:bg-[#161D26]/70 opacity-65 hover:opacity-100"
            }`}
          >
            {/* Micro Thumbnail */}
            <div className={`w-9 h-9 rounded-lg overflow-hidden bg-[#161D26] border shrink-0 flex items-center justify-center transition-all ${
              isCurrent ? "border-[#00C9A7] ring-1 ring-[#00C9A7]/50" : "border-[#1F2D3D]"
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
                <ImageIcon className="w-4 h-4 text-[#64748B]" />
              )}
            </div>

            {/* Info block */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] font-mono font-bold ${isCurrent ? "text-[#00C9A7]" : "text-[#94A3B8]"}`}>
                  Draft #{idx + 1}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 whitespace-nowrap ${
                    isCurrent
                      ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40"
                      : asset.status === "PUBLISHED"
                        ? "bg-[#00C9A7]/20 text-[#00C9A7]"
                        : alreadyLive
                        ? "bg-[#F59E0B]/25 text-[#F59E0B] border border-[#F59E0B]/40"
                        : asset.status === "PENDING_REVIEW"
                          ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                          : asset.status === "SCHEDULED"
                            ? "bg-[#3B82F6]/20 text-[#93C5FD]"
                            : "bg-[#64748B]/20 text-[#94A3B8]"
                  }`}
                >
                  {isCurrent
                    ? "● Spotlight"
                    : alreadyLive
                      ? "Live · Unreviewed"
                      : asset.status === "PENDING_REVIEW"
                        ? "Needs Review"
                        : asset.status === "SCHEDULED"
                          ? "Scheduled"
                          : asset.status}
                </span>
              </div>

              <div className={`text-xs font-semibold line-clamp-2 break-words ${isCurrent ? "text-[#F1F5F9] font-bold" : "text-[#CBD5E1]"}`}>
                {asset.title}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-mono">
                <span>{asset.audience}</span>
                <span>•</span>
                <span>{asset.claims.length > 0 ? `${asset.claims.filter((c) => c.verified === 'Y').length}/${asset.claims.length} Claims` : 'Draft'}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
  );
}
