"use client";

import React from "react";
import {
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  EyeOff,
  Globe,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { formatCost } from "@/utils/format";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { normalizeDomain } from "@/constants/config";
import type { PublishState } from "@/hooks/useEditorialDraft";
import type { AssetItem } from "@/types";

export interface ReviewDockProps {
  activeAsset: AssetItem;
  currentAssetIndex: number;
  totalDrafts: number;
  isDirty: boolean;
  isSaving: boolean;
  publishState: PublishState;
  wordCount: number;
  readingTimeMinutes: number;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  onPublish: () => void;
  setToggleLiveConfirmOpen: (v: boolean) => void;
  setDeleteConfirmOpen: (v: boolean) => void;
  /** Whether this tenant has the blog channel switched on. Undefined means
   *  "not loaded yet" — default to true so the panel doesn't flash blog copy
   *  and then swap to generic copy once the real channel summary lands. */
  blogEnabled?: boolean;
}

/**
 * Sticky review-and-decision panel: save, publish, unpublish, delete, and the
 * draft's real metadata.
 *
 * The publish button reflects the actual request now. It previously stepped
 * through "1/3 Syncing / 2/3 Broadcasting / 3/3 Emitting" on fixed timers while
 * the real call ran inside the last one, so it reported progress that had no
 * relationship to what the server was doing. The per-model cost split shown
 * here was likewise four hardcoded constants that did not sum to the total;
 * only the recorded generation cost remains.
 */
export default function ReviewDock({
  activeAsset,
  currentAssetIndex,
  totalDrafts,
  isDirty,
  isSaving,
  publishState,
  wordCount,
  readingTimeMinutes,
  onPrev,
  onNext,
  onSave,
  onPublish,
  setToggleLiveConfirmOpen,
  setDeleteConfirmOpen,
  blogEnabled = true,
}: ReviewDockProps) {
  // The tenant's own blog host. This badge previously read "Live on
  // getminions.ai" for every tenant, naming the wrong company's site.
  const { brandSettings } = useBrandSettings();
  const blogHost = (normalizeDomain(brandSettings?.company_domain) ?? "").replace(/^https?:\/\//, "");

  /** Live-ness comes from the blog table, not the asset's own status. */
  const alreadyLive = blogEnabled && Boolean(activeAsset.live_blog_url) && activeAsset.status !== "PUBLISHED";

  return (
        <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
            <span className="text-xs font-bold font-mono text-[#F1F5F9] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7]" />
              Review & Decision
            </span>
            {isDirty ? (
              <span className="text-[10px] font-mono text-[#F59E0B] font-bold bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/30 animate-pulse">
                ● Unsaved Edits
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded border border-[#00C9A7]/30">
                {activeAsset.status}
              </span>
            )}
          </div>

          {/* Quick Queue Navigation in Sticky Dock */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              onClick={onPrev}
              className="flex-1 py-1.5 px-2 rounded-lg bg-[#070B0F] hover:bg-[#161D26] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Previous Draft ( [ )"
            >
              <ChevronLeft className="w-3 h-3 text-[#00C9A7]" />
              <span>Prev Draft</span>
            </button>

            <span className="text-[10px] font-mono text-[#64748B] shrink-0 font-bold px-1">
              {currentAssetIndex + 1} / {totalDrafts}
            </span>

            <button
              onClick={onNext}
              className="flex-1 py-1.5 px-2 rounded-lg bg-[#070B0F] hover:bg-[#161D26] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Next Draft ( ] )"
            >
              <span>Next Draft</span>
              <ChevronRight className="w-3 h-3 text-[#00C9A7]" />
            </button>
          </div>

          {/* Quick Save Draft Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDirty
                ? "bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] shadow-md shadow-[#00C9A7]/20"
                : "bg-[#161D26] hover:bg-[#1E2733] text-[#F1F5F9] border border-[#1F2D3D]"
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Saving to Database..." : isDirty ? "Save Draft Changes" : "Draft Synced to Database ✓"}</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-black/20 text-current">
              ⌘S
            </kbd>
          </button>

          {/* Main Publish Decision & Live Visibility Hub */}
          {activeAsset.status === "PUBLISHED" ? (
            <div className="space-y-2 pt-1">
              <div className="w-full bg-[#00C9A7]/15 border border-[#00C9A7] text-[#00C9A7] p-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4" />
                  <span>
                    {blogEnabled && blogHost ? `Live on ${blogHost}` : "Approved & Published"}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
              </div>

              {blogEnabled && (
                <a
                  href={activeAsset.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00C9A7]" />
                  <span>View Live Blog Post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* 1-Click Reversible Unpublish Toggle */}
              <button
                onClick={() => setToggleLiveConfirmOpen(true)}
                className="w-full bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Hide from public site without deleting content"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{blogEnabled ? "Unpublish (Hide from Public)" : "Unpublish"}</span>
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Permanently delete post and claim verifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          ) : activeAsset.status === "UNPUBLISHED" ? (
            <div className="space-y-2.5 pt-1">
              <div className="w-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] p-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4" />
                  <span>Unpublished (Offline)</span>
                </div>
                <span className="text-[10px] font-mono font-normal">Hidden from public</span>
              </div>

              {/* 1-Click Restore to Live */}
              <button
                onClick={() => setToggleLiveConfirmOpen(true)}
                className="w-full bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00C9A7]/20 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{blogEnabled ? "Republish (Put Live on Blog)" : "Republish"}</span>
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Permanently delete post and claim verifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {/* A draft can already be live while its status still reads
                  PENDING_REVIEW — the publisher writes the blog row but does
                  not always flip the asset back. Say so, or the operator
                  publishes the same post twice. */}
              {alreadyLive && (
                <div className="w-full bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-[#F59E0B] p-2.5 rounded-xl text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>This post is already live on the blog</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-[#F59E0B]/80">
                    Publishing again re-runs the broadcast and can duplicate the social posts.
                  </p>
                  <a
                    href={activeAsset.live_blog_url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] underline hover:no-underline"
                  >
                    <span>View the live post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <button
                onClick={onPublish}
                disabled={publishState === "pending"}
                className="w-full bg-[#00C9A7] hover:bg-[#00A88A] active:scale-[0.98] text-[#070B0F] font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-[#00C9A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-75 cursor-pointer"
              >
                {publishState === "pending" ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#070B0F]" />
                    <span>Publishing…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {alreadyLive
                        ? "Republish (Overwrites the Live Post)"
                        : blogEnabled
                          ? "Approve & 1-Click Publish Live"
                          : "Approve & Publish"}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Permanently delete this draft and its claim verifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Draft</span>
              </button>
            </div>
          )}

          {/* Compact Metadata Chips */}
          <div className="pt-2 border-t border-[#1F2D3D]/60 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                <span className="text-[#64748B]">Audience:</span>
                <span className="text-[#F1F5F9] font-bold">{activeAsset.audience}</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                <span className="text-[#64748B]">Length:</span>
                <span className="text-[#F1F5F9] font-bold">{wordCount}w</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                <span className="text-[#64748B]">Read Time:</span>
                <span className="text-[#F1F5F9] font-bold">~{readingTimeMinutes}m</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                <span className="text-[#64748B]">Cost:</span>
                <span className="text-[#00C9A7] font-bold">{formatCost(activeAsset.generation_cost)}</span>
              </div>
            </div>

          </div>
        </div>
  );
}
