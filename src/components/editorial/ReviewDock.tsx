"use client";

import React, { useState } from "react";
import {
  CalendarClock,
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
  Undo2,
} from "lucide-react";
import SchedulePicker, { useWorkspaceTimezone, zoneLabel } from "./SchedulePicker";
import PostChannels from "./PostChannels";
import type { DistributionChannelKey } from "@/types";
import { formatPostTime } from "@/lib/postTime";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { normalizeDomain } from "@/constants/config";
import type { PublishState } from "@/hooks/useEditorialDraft";
import type { AssetItem } from "@/types";

import { buttonStyles } from "@/components/ui/Button";
export interface ReviewDockProps {
  activeAsset: AssetItem;
  currentAssetIndex: number;
  totalDrafts: number;
  isDirty: boolean;
  isSaving: boolean;
  publishState: PublishState;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  onPublish: () => void;
  /** Approve the draft for a local date and time; resolves true when it was scheduled. */
  onSchedule: (date: string, time: string) => Promise<boolean>;
  onUnschedule: () => void;
  /** The workspace's channel switches, for choosing where this post goes (D18). */
  workspaceChannels: Record<DistributionChannelKey, boolean> | null;
  onSetChannels: (channels: string[] | null) => void;
  onMessage: (m: string) => void;
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
  onPrev,
  onNext,
  onSave,
  onPublish,
  onSchedule,
  onUnschedule,
  workspaceChannels,
  onSetChannels,
  onMessage,
  setToggleLiveConfirmOpen,
  setDeleteConfirmOpen,
  blogEnabled = true,
}: ReviewDockProps) {
  const [picking, setPicking] = useState(false);
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const timezone = useWorkspaceTimezone();
  // Close the picker when the reviewer moves to another draft.
  if (pickingFor !== activeAsset.id) {
    setPickingFor(activeAsset.id);
    setPicking(false);
  }
  const confirmSchedule = async (date: string, time: string) => {
    if (await onSchedule(date, time)) setPicking(false);
  };
  // The tenant's own blog host. This badge previously read "Live on
  // getminions.ai" for every tenant, naming the wrong company's site.
  const { brandSettings } = useBrandSettings();
  const blogHost = (normalizeDomain(brandSettings?.company_domain) ?? "").replace(/^https?:\/\//, "");

  /** Live-ness comes from the blog table, not the asset's own status. */
  const alreadyLive = blogEnabled && Boolean(activeAsset.live_blog_url) && activeAsset.status !== "PUBLISHED";

  return (
        <div className="bg-surface rounded-2xl border border-line p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-line/60">
            <span className="text-xs font-bold font-mono text-ink uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
              Review & Decision
            </span>
            {isDirty ? (
              <span className="text-[10px] font-mono text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/30 animate-pulse">
                ● Unsaved Edits
              </span>
            ) : (
              <span className="text-[10px] font-mono text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/30">
                {activeAsset.status}
              </span>
            )}
          </div>

          {/* Quick Queue Navigation in Sticky Dock */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              onClick={onPrev}
              className="flex-1 py-1.5 px-2 rounded-lg bg-canvas hover:bg-surface-2 border border-line text-muted hover:text-ink text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Previous Draft ( [ )"
            >
              <ChevronLeft className="w-3 h-3 text-brand" />
              <span>Prev Draft</span>
            </button>

            <span className="text-[10px] font-mono text-subtle shrink-0 font-bold px-1">
              {currentAssetIndex + 1} / {totalDrafts}
            </span>

            <button
              onClick={onNext}
              className="flex-1 py-1.5 px-2 rounded-lg bg-canvas hover:bg-surface-2 border border-line text-muted hover:text-ink text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Next Draft ( ] )"
            >
              <span>Next Draft</span>
              <ChevronRight className="w-3 h-3 text-brand" />
            </button>
          </div>

          {/* Quick Save Draft Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className={buttonStyles({ variant: isDirty ? "primary" : "secondary", size: "sm", block: true })}
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
              <div className="w-full bg-brand/15 border border-brand text-brand p-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4" />
                  <span>
                    {blogEnabled && blogHost ? `Live on ${blogHost}` : "Approved & Published"}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              </div>

              {blogEnabled && (
                <a
                  href={activeAsset.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-surface-2 hover:bg-surface-3 border border-line text-ink text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-brand" />
                  <span>View Live Blog Post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* 1-Click Reversible Unpublish Toggle */}
              <button
                onClick={() => setToggleLiveConfirmOpen(true)}
                className="w-full bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Hide from public site without deleting content"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{blogEnabled ? "Unpublish (Hide from Public)" : "Unpublish"}</span>
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Permanently delete post and claim verifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          ) : activeAsset.status === "SCHEDULED" ? (
            <div className="space-y-2 pt-1">
              <div className="w-full bg-[#3B82F6]/10 border border-[#3B82F6]/40 text-[#93C5FD] p-2.5 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CalendarClock className="w-4 h-4" />
                  <span>Scheduled</span>
                </div>
                <p className="text-[11px] text-[#CBD5E1]">
                  {activeAsset.scheduled_for && timezone
                    ? `Goes out ${formatPostTime(activeAsset.scheduled_for, timezone)} (${zoneLabel(timezone)}).`
                    : "Goes out at the chosen time."}{" "}
                  Edits you save before then go out with it.
                </p>
              </div>

              <PostChannels
                override={activeAsset.channels}
                workspace={workspaceChannels}
                disabled={publishState === "pending"}
                onChange={onSetChannels}
                onMessage={onMessage}
              />

              {picking ? (
                <SchedulePicker
                  current={activeAsset.scheduled_for}
                  busy={publishState === "pending"}
                  confirmLabel="Move to this time"
                  onConfirm={(d, t) => void confirmSchedule(d, t)}
                  onCancel={() => setPicking(false)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPicking(true)}
                    disabled={publishState === "pending"}
                    className="bg-surface-2 hover:bg-surface-3 border border-line text-ink text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-brand" />
                    Change time
                  </button>
                  <button
                    onClick={onPublish}
                    disabled={publishState === "pending"}
                    className={buttonStyles({ size: "sm" })}
                  >
                    {publishState === "pending" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Publish now
                  </button>
                </div>
              )}

              <button
                onClick={onUnschedule}
                disabled={publishState === "pending"}
                className="w-full bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                title="Back to review; it goes nowhere until you approve it again"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Cancel schedule</span>
              </button>
            </div>
          ) : activeAsset.status === "UNPUBLISHED" ? (
            <div className="space-y-2.5 pt-1">
              <div className="w-full bg-gold/15 border border-gold/40 text-gold p-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4" />
                  <span>Unpublished (Offline)</span>
                </div>
                <span className="text-[10px] font-mono font-normal">Hidden from public</span>
              </div>

              {/* 1-Click Restore to Live */}
              <button
                onClick={() => setToggleLiveConfirmOpen(true)}
                className={buttonStyles({ size: "sm", className: "w-full" })}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{blogEnabled ? "Republish (Put Live on Blog)" : "Republish"}</span>
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
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
                <div className="w-full bg-gold/10 border border-gold/40 text-gold p-2.5 rounded-xl text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>This post is already live on the blog</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-gold/80">
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

              {!alreadyLive && (<PostChannels
                override={activeAsset.channels}
                workspace={workspaceChannels}
                disabled={publishState === "pending"}
                onChange={onSetChannels}
                onMessage={onMessage}
              />)}

              <button
                onClick={onPublish}
                disabled={publishState === "pending"}
                className={buttonStyles({ size: "sm", className: "w-full" })}
              >
                {publishState === "pending" ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-canvas" />
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

              {!alreadyLive &&
                (picking ? (
                  <SchedulePicker
                    current={null}
                    busy={publishState === "pending"}
                    confirmLabel="Approve & schedule"
                    onConfirm={(d, t) => void confirmSchedule(d, t)}
                    onCancel={() => setPicking(false)}
                  />
                ) : (
                  <button
                    onClick={() => setPicking(true)}
                    disabled={publishState === "pending"}
                    className="w-full bg-surface-2 hover:bg-surface-3 border border-line text-ink text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-brand" />
                    <span>Approve & schedule for later</span>
                  </button>
                ))}

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Permanently delete this draft and its claim verifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Draft</span>
              </button>
            </div>
          )}


        </div>
  );
}
