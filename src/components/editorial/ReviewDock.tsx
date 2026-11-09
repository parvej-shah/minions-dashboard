"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  EyeOff,
  Globe,
  RefreshCw,
  Repeat2,
  Trash2,
  Undo2,
} from "lucide-react";
import SchedulePicker, { useWorkspaceTimezone, zoneLabel } from "./SchedulePicker";
import PostChannels from "./PostChannels";
import type { DistributionChannelKey } from "@/types";
import { formatPostTime } from "@/lib/postTime";
import type { PublishState } from "@/hooks/useEditorialDraft";
import type { AssetItem } from "@/types";
import { liveLinks } from "@/lib/drafts/liveLinks";

import { buttonStyles } from "@/components/ui/Button";
export interface ReviewDockProps {
  activeAsset: AssetItem;
  isDirty: boolean;
  publishState: PublishState;
  onPublish: () => void;
  /** Approve the draft for a local date and time; resolves true when it was scheduled. */
  onSchedule: (date: string, time: string) => Promise<boolean>;
  onUnschedule: () => void;
  /** The reviewer copied the post to LinkedIn themselves: record it as out. Sends nothing. */
  onMarkPosted: () => void;
  /** The workspace's channel switches, for choosing where this post goes (D18). */
  workspaceChannels: Record<DistributionChannelKey, boolean> | null;
  onSetChannels: (channels: string[] | null) => void;
  onMessage: (m: string) => void;
  setToggleLiveConfirmOpen: (v: boolean) => void;
  setDeleteConfirmOpen: (v: boolean) => void;
  /** Opens the confirm for deleting the post on LinkedIn; only offered when Minions holds its LinkedIn id. */
  setUnpublishLinkedInConfirmOpen?: (v: boolean) => void;
  /** Whether this tenant has the blog channel switched on. Undefined means
   *  "not loaded yet" — default to true so the panel doesn't flash blog copy
   *  and then swap to generic copy once the real channel summary lands. */
  blogEnabled?: boolean;
  /** Drafts a second LinkedIn post of this published draft in the format it did not use. */
  onPostAgain: () => void;
  isPostingAgain: boolean;
  /** Once this draft is out of the queue: how many still wait, and how to open the next. */
  nextToReview?: { left: number; open: () => void } | null;
}

/**
 * Sticky review-and-decision panel: save, publish, unpublish, delete, and the
 * draft's real metadata. The publish button follows the actual request, and
 * the cost shown is the recorded generation cost, never an estimate.
 */
export default function ReviewDock({
  activeAsset,
  isDirty,
  publishState,
  onPublish,
  onSchedule,
  onUnschedule,
  onMarkPosted,
  workspaceChannels,
  onSetChannels,
  onMessage,
  setToggleLiveConfirmOpen,
  setDeleteConfirmOpen,
  setUnpublishLinkedInConfirmOpen,
  blogEnabled = true,
  onPostAgain,
  isPostingAgain,
  nextToReview,
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

  /** Live-ness comes from the blog table, not the asset's own status. */
  const alreadyLive = blogEnabled && Boolean(activeAsset.live_blog_url) && activeAsset.status !== "PUBLISHED";
  // Claims the draft check could not trace to the author. Publishing stays open;
  // the warning sits on the button so it is not missed below the fold.
  const flaggedClaims = activeAsset.claims.filter((claim) => claim.verified !== "Y").length;
  const isPublished = activeAsset.status === "PUBLISHED";
  const links = liveLinks(activeAsset, blogEnabled);
  const wentToLinkedIn = Boolean(activeAsset.linkedin_url || activeAsset.linkedin_went_as);
  // Minions can delete a LinkedIn post only when it posted it and kept the id;
  // a post copied there by hand has none, so it offers no LinkedIn unpublish.
  const canUnpublishLinkedIn = Boolean(activeAsset.linkedin_removable && setUnpublishLinkedInConfirmOpen);
  // Unpublishing from LinkedIn also takes the blog copy down, so the blog-only option steps aside.
  const canTakeDown = !canUnpublishLinkedIn && blogEnabled && Boolean(activeAsset.live_blog_url || activeAsset.doc_url);
  const heading = isPublished
    ? wentToLinkedIn ? "Posted on LinkedIn" : "Published"
    : activeAsset.status === "SCHEDULED"
      ? "Scheduled"
      : activeAsset.status === "UNPUBLISHED"
        ? "Taken down"
        : "Ready to publish?";
  const intro = activeAsset.follow_up_of && !isPublished
    ? `A second LinkedIn post of a published draft, with its ${activeAsset.follow_up_format === "CAROUSEL" ? "carousel" : "cover"}. It goes to LinkedIn only. Schedule it a few days after the first.`
    : activeAsset.status === "PENDING_REVIEW" || activeAsset.status === "DRAFT"
      ? "Check the post, choose where it goes, then publish now or schedule it."
      : null;
  const deleteLink = (label: string) => (
    <button
      type="button"
      onClick={() => setDeleteConfirmOpen(true)}
      className="mx-auto flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:text-danger"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );

  return (
        <div className="bg-surface rounded-2xl border border-line p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-ink">{heading}</h2>
            {isDirty && (
              <span className="text-[11px] font-semibold text-gold">Unsaved edits</span>
            )}
          </div>
          {intro && <p className="-mt-2 text-xs leading-relaxed text-muted">{intro}</p>}

          {nextToReview && (isPublished || activeAsset.status === "SCHEDULED") && (
            <button type="button" onClick={nextToReview.open} className={buttonStyles({ size: "sm", block: true })}>
              <span>Next draft ({nextToReview.left} to review)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Main Publish Decision & Live Visibility Hub */}
          {isPublished ? (
            <div className="space-y-2">
              {links.map((link, i) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: i === 0 ? "primary" : "secondary", size: "sm", block: true })}
                >
                  <span>View on {link.label}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}

              {/* The format LinkedIn did not get goes out as a second post, never by changing the first. */}
              {activeAsset.linkedin_went_as && !activeAsset.follow_up_of && (
                <div className="space-y-1 pt-2">
                  <button
                    onClick={onPostAgain}
                    disabled={isPostingAgain}
                    className={buttonStyles({ variant: "secondary", size: "sm", block: true })}
                  >
                    {isPostingAgain ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" /> : <Repeat2 className="w-3.5 h-3.5 text-brand" />}
                    <span>
                      {isPostingAgain
                        ? "Writing the second post…"
                        : activeAsset.linkedin_went_as === "COVER"
                          ? "Post the carousel on LinkedIn too"
                          : "Post the cover on LinkedIn too"}
                    </span>
                  </button>
                  <p className="text-[11px] leading-relaxed text-subtle">
                    Drafts a second LinkedIn post with new text, for your review. Nothing goes out until you approve it.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-x-2 border-t border-line/60 pt-2">
                {canUnpublishLinkedIn && (
                  <button
                    type="button"
                    onClick={() => setUnpublishLinkedInConfirmOpen?.(true)}
                    className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:text-gold"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Unpublish from LinkedIn</span>
                  </button>
                )}
                {canTakeDown && (
                  <button
                    type="button"
                    onClick={() => setToggleLiveConfirmOpen(true)}
                    className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:text-gold"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Take down from blog</span>
                  </button>
                )}
                {deleteLink("Remove from Minions")}
              </div>
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

              {!activeAsset.follow_up_of && (
                <PostChannels
                  override={activeAsset.channels}
                  workspace={workspaceChannels}
                  disabled={publishState === "pending"}
                  onChange={onSetChannels}
                  onMessage={onMessage}
                />
              )}

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
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-muted">It&apos;s off your blog. Put it back whenever you like.</p>
              <button
                onClick={() => setToggleLiveConfirmOpen(true)}
                className={buttonStyles({ size: "sm", className: "w-full" })}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Put it back on the blog</span>
              </button>
              {deleteLink("Remove from Minions")}
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

              {!alreadyLive && !activeAsset.follow_up_of && (<PostChannels
                override={activeAsset.channels}
                workspace={workspaceChannels}
                disabled={publishState === "pending"}
                onChange={onSetChannels}
                onMessage={onMessage}
              />)}

              {flaggedClaims > 0 && (
                <p role="note" className="flex items-start gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-2 text-xs font-medium text-[#FCD34D]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {flaggedClaims} fact{flaggedClaims === 1 ? " isn't" : "s aren't"} checked yet. Look at Facts in this post above and mark{" "}
                    {flaggedClaims === 1 ? "it" : "each one"} Checked, or edit the post.
                  </span>
                </p>
              )}

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
                      {alreadyLive ? "Republish (overwrites the live post)" : "Approve & publish"}
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

              {/* For people who copy the post to LinkedIn themselves. Sends nothing. */}
              {!alreadyLive && (
                <div className="space-y-1">
                  <button
                    onClick={onMarkPosted}
                    disabled={publishState === "pending"}
                    className="w-full bg-surface-2 hover:bg-surface-3 border border-line text-ink text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-brand" />
                    <span>Mark as posted</span>
                  </button>
                  <p className="text-[11px] leading-relaxed text-subtle">
                    Already pasted it into LinkedIn yourself? Use Copy above, post it, then click this. Nothing is sent from here.
                  </p>
                </div>
              )}

              {deleteLink("Delete draft")}
            </div>
          )}


        </div>
  );
}
