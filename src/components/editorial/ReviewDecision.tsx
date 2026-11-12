"use client";

import { failureList, failureSummary } from "@/lib/publishFailures";
import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import SchedulePicker, { useWorkspaceTimezone } from "./SchedulePicker";
import PostChannels from "./PostChannels";
import { buttonStyles } from "@/components/ui/Button";
import { useApiResource } from "@/hooks/useApiResource";
import { MIN_LEAD_MINUTES, utcToZoned } from "@/lib/postTime";
import { nextFreeSlot } from "@/lib/drafts/nextSlot";
import { postButtonLabel, whereText } from "@/lib/drafts/decision";
import { slotLabel } from "@/lib/today";
import { liveLinks } from "@/lib/drafts/liveLinks";
import type { PublishState } from "@/hooks/useEditorialDraft";
import type { AssetItem, DistributionChannelKey } from "@/types";

export interface ReviewDecisionProps {
  activeAsset: AssetItem;
  isDirty: boolean;
  publishState: PublishState;
  /** Approve and publish right away. */
  onPublish: () => void;
  /** Approve the draft for a local date and time; resolves true when it was scheduled. */
  onSchedule: (date: string, time: string) => Promise<boolean>;
  onUnschedule: () => void;
  /** The reviewer copied the post to LinkedIn themselves: record it as out. Sends nothing. */
  onMarkPosted: () => void;
  /** Opens the post's text for editing (optional). */
  onEdit?: () => void;
  /** Times other scheduled posts already hold, so the suggested slot is free. */
  takenTimes: string[];
  /** The workspace's channel switches, for choosing where this post goes (D18). */
  workspaceChannels: Record<DistributionChannelKey, boolean> | null;
  onSetChannels: (channels: string[] | null) => void;
  onMessage: (m: string) => void;
  setToggleLiveConfirmOpen: (v: boolean) => void;
  setDeleteConfirmOpen: (v: boolean) => void;
  /** Opens the confirm for deleting the post on LinkedIn; only offered when Minions holds its LinkedIn id. */
  setUnpublishLinkedInConfirmOpen?: (v: boolean) => void;
  blogEnabled?: boolean;
  /** Drafts a second LinkedIn post of this published draft in the format it did not use. */
  onPostAgain: () => void;
  isPostingAgain: boolean;
  /** Posts this published draft again to a channel that refused it. */
  onRetryChannel?: (channel: "linkedin" | "instagram") => void;
  retryingChannel?: string | null;
  /** Once this draft is out of the queue: how many still wait, and how to open the next. */
  nextToReview?: { left: number; open: () => void } | null;
  /** Shown under a scheduled post, e.g. the weekly-update ask right after approval. */
  afterApprove?: React.ReactNode;
  /** The checks and facts, folded under Details. */
  details?: React.ReactNode;
  detailsSummary?: string;
  detailsOpen?: boolean;
}

/** A small grey label over a value: "Goes out / Wed 11 Nov, 09:00". */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-muted">{label}</p>
      {children}
    </div>
  );
}

const linkButton = "w-fit cursor-pointer text-[15px] text-brand hover:underline disabled:opacity-50";
const quietButton = "cursor-pointer py-2 text-center text-[15px] text-brand hover:underline disabled:opacity-50";
const note = "text-sm leading-relaxed text-muted";

/**
 * The decision for one post, with one obvious next step. A waiting post goes
 * into the next free posting time with one click; posting now, another time,
 * marking it posted by hand and deleting stay one step quieter.
 */
export default function ReviewDecision(props: ReviewDecisionProps) {
  const {
    activeAsset,
    isDirty,
    publishState,
    onPublish,
    onSchedule,
    onUnschedule,
    onMarkPosted,
    takenTimes,
    workspaceChannels,
    onSetChannels,
    onMessage,
    setToggleLiveConfirmOpen,
    setDeleteConfirmOpen,
    setUnpublishLinkedInConfirmOpen,
    blogEnabled = true,
    onPostAgain,
    isPostingAgain,
    onRetryChannel,
    retryingChannel,
    nextToReview,
    afterApprove,
    details,
    detailsSummary,
    detailsOpen,
  } = props;

  const [picking, setPicking] = useState(false);
  const [editingWhere, setEditingWhere] = useState(false);
  const [shownFor, setShownFor] = useState<string | null>(null);
  const [openDetails, setOpenDetails] = useState(detailsOpen ?? false);
  // Fold the pickers away when the reviewer moves to another post.
  if (shownFor !== activeAsset.id) {
    setShownFor(activeAsset.id);
    setPicking(false);
    setEditingWhere(false);
    setOpenDetails(detailsOpen ?? false);
  }

  const timezone = useWorkspaceTimezone();
  const preview = useApiResource<{ slots: string[] }>("/api/schedule/preview?count=10", { slots: [] });
  const now = useMemo(() => new Date(), []);
  const slot = nextFreeSlot(preview.data.slots, takenTimes, now.getTime(), MIN_LEAD_MINUTES);

  const busy = publishState === "pending";
  const status = activeAsset.status;
  const isPublished = status === "PUBLISHED";
  const followUp = Boolean(activeAsset.follow_up_of);
  const alreadyLive = blogEnabled && Boolean(activeAsset.live_blog_url) && !isPublished;
  const where = followUp ? "LinkedIn only" : whereText(activeAsset.channels, workspaceChannels);
  const goesToLinkedIn = followUp || Boolean(where?.includes("LinkedIn"));

  const schedule = async (date: string, time: string) => {
    if (await onSchedule(date, time)) setPicking(false);
  };
  const postInSlot = () => {
    if (!slot || !timezone) return;
    const { date, time } = utcToZoned(new Date(slot), timezone);
    void schedule(date, time);
  };

  const whereField = where && (
    <Field label="Where">
      <p className="text-[17px] text-ink">{where}</p>
      {!followUp && !alreadyLive && (
        editingWhere ? (
          <PostChannels override={activeAsset.channels} workspace={workspaceChannels} disabled={busy} onChange={onSetChannels} onMessage={onMessage} />
        ) : (
          <button type="button" onClick={() => setEditingWhere(true)} className={linkButton}>Change</button>
        )
      )}
    </Field>
  );

  const detailsBlock = details && (
    <div className="border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setOpenDetails((v) => !v)}
        aria-expanded={openDetails}
        className="group flex w-full cursor-pointer items-center text-left text-[15px] font-medium text-ink"
      >
        <span className={`mr-1.5 inline-block text-subtle transition-transform duration-200 ${openDetails ? "rotate-90" : ""}`}>›</span>
        {detailsSummary ?? "Details"}
      </button>
      <div className={`accordion-grid ${openDetails ? "expanded" : ""}`}>
        <div className="accordion-inner">
          <div className="mt-4 space-y-5">{details}</div>
        </div>
      </div>
    </div>
  );

  const unsaved = isDirty && <p className="text-sm font-medium text-gold">You have unsaved edits. They go out once saved.</p>;
  const nextButton = nextToReview && (
    <button type="button" onClick={nextToReview.open} className={buttonStyles({ size: "lg", block: true })}>
      Next post ({nextToReview.left} waiting)
    </button>
  );

  // ── Posted ────────────────────────────────────────────────────────────────
  if (isPublished) {
    const links = liveLinks(activeAsset, blogEnabled);
    const failures = failureList(activeAsset.publish_failures);
    const canUnpublishLinkedIn = Boolean(activeAsset.linkedin_removable && setUnpublishLinkedInConfirmOpen);
    const canTakeDown = !canUnpublishLinkedIn && blogEnabled && Boolean(activeAsset.live_blog_url || activeAsset.doc_url);
    return (
      <div className="flex flex-col gap-6">
        <Field label="Posted">
          <p className="text-2xl font-semibold tracking-[-0.02em] text-ink">
            {activeAsset.published_at && timezone ? slotLabel(activeAsset.published_at, timezone) : "Out"}
          </p>
        </Field>
        {failures.length > 0 && (
          <div role="alert" className="flex flex-col gap-1.5">
            <p className="text-[17px] font-semibold text-danger">{failureSummary(activeAsset.publish_failures)}</p>
            {failures.map((f) => (
              <p key={f.channel} className="text-[15px] text-muted">{f.label}: {f.reason}</p>
            ))}
            {onRetryChannel && failures.filter((f) => f.channel !== "facebook").map((f) => (
              <button key={f.channel} type="button" onClick={() => onRetryChannel(f.channel as "linkedin" | "instagram")} disabled={Boolean(retryingChannel)} className={linkButton}>
                {retryingChannel === f.channel ? `Posting to ${f.label}…` : `Try ${f.label} again`}
              </button>
            ))}
          </div>
        )}
        {nextButton}
        {afterApprove}
        {links.length > 0 && (
          <div className="flex flex-col gap-3">
            {links.map((link, i) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: i === 0 && !nextButton ? "primary" : "soft", size: "lg", block: true })}>
                View on {link.label} ↗
              </a>
            ))}
          </div>
        )}
        {activeAsset.linkedin_went_as && !followUp && (
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={onPostAgain} disabled={isPostingAgain} className={linkButton}>
              {isPostingAgain
                ? "Writing the second post…"
                : activeAsset.linkedin_went_as === "COVER"
                  ? "Post the carousel on LinkedIn too"
                  : "Post the cover on LinkedIn too"}
            </button>
            <p className={note}>Writes a second LinkedIn post for your review. Nothing goes out until you approve it.</p>
          </div>
        )}
        <div className="flex flex-col items-start gap-1 border-t border-line pt-4">
          {canUnpublishLinkedIn && (
            <button type="button" onClick={() => setUnpublishLinkedInConfirmOpen?.(true)} className={linkButton}>Unpublish from LinkedIn</button>
          )}
          {canTakeDown && (
            <button type="button" onClick={() => setToggleLiveConfirmOpen(true)} className={linkButton}>Take it down from your blog</button>
          )}
          <button type="button" onClick={() => setDeleteConfirmOpen(true)} className="cursor-pointer text-[15px] text-danger hover:underline">Remove from Minions</button>
        </div>
      </div>
    );
  }

  // ── Taken down ────────────────────────────────────────────────────────────
  if (status === "UNPUBLISHED") {
    return (
      <div className="flex flex-col gap-6">
        <Field label="Status">
          <p className="text-2xl font-semibold tracking-[-0.02em] text-ink">Off your blog</p>
        </Field>
        <p className={note}>Nothing was deleted. Put it back whenever you like.</p>
        <button type="button" onClick={() => setToggleLiveConfirmOpen(true)} className={buttonStyles({ size: "lg", block: true })}>
          Put it back on your blog
        </button>
        <button type="button" onClick={() => setDeleteConfirmOpen(true)} className="cursor-pointer text-[15px] text-danger hover:underline">Remove from Minions</button>
      </div>
    );
  }

  // ── Scheduled ─────────────────────────────────────────────────────────────
  if (status === "SCHEDULED") {
    return (
      <div className="flex flex-col gap-6">
        <Field label="Goes out">
          <p className="text-2xl font-semibold tracking-[-0.02em] text-success">
            {activeAsset.scheduled_for && timezone ? slotLabel(activeAsset.scheduled_for, timezone) : "At the chosen time"}
          </p>
          {picking ? (
            <SchedulePicker current={activeAsset.scheduled_for} busy={busy} confirmLabel="Move to this time" onConfirm={(d, t) => void schedule(d, t)} onCancel={() => setPicking(false)} />
          ) : (
            <button type="button" onClick={() => setPicking(true)} disabled={busy} className={linkButton}>Change time</button>
          )}
        </Field>
        {whereField}
        {unsaved}
        <div className="flex flex-col gap-3">
          {nextButton}
          <button type="button" onClick={onPublish} disabled={busy} className={buttonStyles({ variant: nextButton ? "soft" : "primary", size: "lg", block: true })}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Post now instead
          </button>
          <button type="button" onClick={onUnschedule} disabled={busy} className={quietButton}>
            Cancel the schedule
          </button>
        </div>
        <p className={note}>Edits you save before then go out with it.</p>
        {afterApprove}
        {detailsBlock}
      </div>
    );
  }

  // ── Waiting for you ───────────────────────────────────────────────────────
  // Until the posting times load, the button waits rather than defaulting to "Post now".
  const loadingSlot = !alreadyLive && (preview.isLoading || !timezone);
  const primary = alreadyLive
    ? { label: "Republish (replaces the live post)", run: onPublish }
    : loadingSlot
      ? { label: "Finding your next posting time…", run: () => {} }
      : slot && timezone
      ? { label: postButtonLabel(slot, timezone, now), run: postInSlot }
      : { label: "Post now", run: onPublish };

  return (
    <div className="flex flex-col gap-6">
      {followUp && (
        <p className={note}>
          A second LinkedIn post of one that already went out, with its {activeAsset.follow_up_format === "CAROUSEL" ? "carousel" : "cover"}. Give it a few days after the first.
        </p>
      )}

      {alreadyLive ? (
        <div className="space-y-1.5 rounded-2xl bg-gold/5 p-4">
          <p className="text-[15px] font-semibold text-gold">This post is already on your blog.</p>
          <p className={note}>Posting it again re-sends it and can repeat the social posts.</p>
          {activeAsset.live_blog_url && (
            <a href={activeAsset.live_blog_url} target="_blank" rel="noopener noreferrer" className="text-[15px] text-brand hover:underline">View the live post ↗</a>
          )}
        </div>
      ) : (
        <Field label="Goes out">
          <p className="text-2xl font-semibold tracking-[-0.02em] text-ink">
            {loadingSlot ? "…" : slot && timezone ? slotLabel(slot, timezone) : "As soon as you approve it"}
          </p>
          {picking ? (
            <SchedulePicker current={null} busy={busy} confirmLabel="Approve for this time" onConfirm={(d, t) => void schedule(d, t)} onCancel={() => setPicking(false)} />
          ) : (
            <button type="button" onClick={() => setPicking(true)} disabled={busy} className={linkButton}>Change time</button>
          )}
        </Field>
      )}

      {whereField}
      {unsaved}

      <div className="flex flex-col gap-3">
        <button type="button" onClick={primary.run} disabled={busy || loadingSlot} className={buttonStyles({ size: "lg", block: true })}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Working…" : primary.label}
        </button>
        {!alreadyLive && !loadingSlot && primary.run !== onPublish && (
          <button type="button" onClick={onPublish} disabled={busy} className={buttonStyles({ variant: "soft", size: "lg", block: true })}>
            Post now instead
          </button>
        )}
        <button type="button" onClick={() => setDeleteConfirmOpen(true)} className={quietButton}>
          Not this one, delete it
        </button>
      </div>

      <p className={note}>
        {goesToLinkedIn ? "You can pull it back from LinkedIn any time after it posts." : "You can take it down any time after it posts."}
        {!alreadyLive && (
          <>
            {" "}Posted it yourself already?{" "}
            <button type="button" onClick={onMarkPosted} disabled={busy} className="cursor-pointer text-brand hover:underline disabled:opacity-50">
              Mark as posted
            </button>
          </>
        )}
      </p>

      {detailsBlock}
    </div>
  );
}
