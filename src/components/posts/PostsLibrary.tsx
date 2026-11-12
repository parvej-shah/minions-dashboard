"use client";

import React, { useMemo, useState } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import { useChannelSummary } from "@/hooks/useChannelSummary";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { nextFreeSlot } from "@/lib/drafts/nextSlot";
import { MIN_LEAD_MINUTES } from "@/lib/postTime";
import { slotLabel, todaySchedulePayload } from "@/lib/today";
import {
  defaultShow,
  postsFor,
  splitCuratedAndReserve,
  sortReservePosts,
  type PostShow,
} from "@/lib/posts/library";
import { liveLinks } from "@/lib/drafts/liveLinks";
import { Segmented, SearchField } from "@/components/ui/Filters";
import { buttonStyles } from "@/components/ui/Button";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { cardClass } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Text";
import Toast from "@/components/ui/Toast";
import CuratedPostsTray from "./CuratedPostsTray";
import PostCardPeek from "./PostCardPeek";
import QuickDraftDrawer from "./QuickDraftDrawer";
import type { AssetItem } from "@/types";

const SHOWS: { key: PostShow; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs", label: "Needs you" },
  { key: "scheduled", label: "Scheduled" },
  { key: "posted", label: "Posted" },
];

const EMPTY: Record<PostShow, string> = {
  all: "No posts yet. Minions writes your first one from your ideas.",
  needs: "Nothing needs you right now.",
  scheduled: "Nothing is scheduled.",
  posted: "Nothing has gone out yet.",
};

/** The Posts library: calm executive triage shelf + searchable image-first grid. */
export default function PostsLibrary({ initialShow }: { initialShow: PostShow | null }) {
  const assets = useApiResource<AssetItem[]>("/api/assets", [], { errorMessage: "Could not load your posts" });
  const schedule = useApiResource<{ timezone?: string } | null>("/api/schedule", null);
  const preview = useApiResource<{ slots: string[] }>("/api/schedule/preview?count=14", { slots: [] });
  const channels = useChannelSummary();
  const [chosen, setChosen] = useState<PostShow | null>(initialShow);
  const [query, setQuery] = useState("");
  const [reserveSort, setReserveSort] = useState<"newest" | "oldest">("newest");
  const [isReserveExpanded, setIsReserveExpanded] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [isQuickDraftOpen, setIsQuickDraftOpen] = useState(false);
  const toast = useToast(3500);

  const tz = schedule.data?.timezone || DEFAULT_TIMEZONE;
  const show = chosen ?? defaultShow(assets.data);
  const q = query.trim().toLowerCase();
  const now = useMemo(() => new Date(), []);
  const taken = assets.data.filter((a) => a.status === "SCHEDULED" && a.scheduled_for).map((a) => a.scheduled_for!);
  const nextSlot = nextFreeSlot(preview.data.slots, taken, now.getTime(), MIN_LEAD_MINUTES);

  const unapproved = postsFor(assets.data, "needs");
  const { curated, reserve: unapprovedReserve } = splitCuratedAndReserve(unapproved, 3);
  const sortedReserve = sortReservePosts(unapprovedReserve, reserveSort);

  const list = postsFor(assets.data, show).filter((p) => !q || p.title.toLowerCase().includes(q));

  const pick = (key: PostShow) => {
    setChosen(key);
    const url = new URL(window.location.href);
    url.searchParams.set("show", key);
    window.history.replaceState(null, "", url);
  };

  const handleSchedulePost = async (postId: string) => {
    if (!nextSlot || schedulingId) return;
    setSchedulingId(postId);
    const { date, time } = todaySchedulePayload(nextSlot, tz);
    const slotText = slotLabel(nextSlot, tz);

    try {
      await apiClient.post(`/api/assets/${postId}/schedule`, { date, time });
      window.dispatchEvent(new Event("minions-counts-updated"));
      toast.show(`Scheduled for ${slotText}`);
      void assets.reload();
    } catch {
      toast.show("Could not schedule post. Please try again.");
    } finally {
      setSchedulingId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await apiClient.delete(`/api/assets/${postId}?mode=permanent`);
      window.dispatchEvent(new Event("minions-counts-updated"));
      toast.show("Draft deleted");
      void assets.reload();
    } catch {
      toast.show("Could not delete draft. Please try again.");
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <PageHeader title="Posts">
          {show === "needs" ? "Top three picks for you." : null}
        </PageHeader>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <Segmented
            label="Show"
            options={SHOWS.map((s) => ({
              key: s.key,
              label: s.label,
            }))}
            value={show}
            onChange={pick}
            equalWidth
          />
          <div className="flex w-full items-center gap-2.5 sm:w-full">
            <SearchField label="Search posts" value={query} onChange={setQuery} className="flex-1 min-w-0" />
            <button
              type="button"
              onClick={() => setIsQuickDraftOpen(true)}
              className={buttonStyles({
                variant: "secondary",
                size: "md",
                className: "min-h-11 shrink-0 cursor-pointer whitespace-nowrap px-4",
              })}
            >
              + Quick draft
            </button>
          </div>
        </div>
      </div>

      {assets.isLoading ? (
        <SkeletonGroup label="Loading posts" className="columns-2 gap-5 sm:columns-3 lg:columns-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className={`mb-6 w-full rounded-2xl ${i % 3 === 0 ? "aspect-square" : "aspect-[4/5]"}`} />
          ))}
        </SkeletonGroup>
      ) : assets.error ? (
        <div className={cardClass({ pad: "lg", className: "text-center" })}>
          <p className="text-[17px] text-ink">{assets.error}</p>
          <button type="button" onClick={() => void assets.reload()} className={buttonStyles({ className: "mt-5" })}>
            Try again
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className={cardClass({ tone: "well", pad: "none", className: "px-6 py-16 text-center" })}>
          <p className="text-[17px] text-muted">{q ? `No posts match “${query}”.` : EMPTY[show]}</p>
          {!q && show !== "all" && (
            <button type="button" onClick={() => pick("all")} className="mt-3 cursor-pointer text-[17px] text-brand hover:underline">
              See all posts
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Curated Top-3 Shelf: Shown when on 'needs' tab without query */}
          {show === "needs" && !q && curated.length > 0 && (
            <CuratedPostsTray
              posts={curated}
              nextSlot={nextSlot}
              timeZone={tz}
              onSchedule={handleSchedulePost}
              onDelete={handleDeletePost}
              schedulingId={schedulingId}
            />
          )}

          {/* Reserve / Library Grid */}
          <section aria-labelledby="posts-grid-heading" className="space-y-4">
            {show === "needs" && !q && curated.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-line">
                <div>
                  <h3 id="posts-grid-heading" className="text-[17px] font-semibold text-ink flex items-center gap-2">
                    <span>Draft reserve</span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[12px] font-medium text-muted">
                      {sortedReserve.length}
                    </span>
                  </h3>
                  <p className="text-[13px] text-muted mt-0.5">
                    <span className="hidden sm:inline">Additional drafted posts waiting in your library. Hover to preview hook and schedule.</span>
                    <span className="sm:hidden">Additional drafted posts in your library.</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isReserveExpanded && sortedReserve.length > 1 && (
                    <div className="flex items-center gap-2 pr-3 border-r border-line">
                      <span className="text-[12px] text-muted">Sort:</span>
                      <button
                        type="button"
                        onClick={() => setReserveSort(reserveSort === "newest" ? "oldest" : "newest")}
                        className="cursor-pointer text-[12px] font-medium text-brand hover:underline"
                      >
                        {reserveSort === "newest" ? "Newest first ▾" : "Oldest first ▾"}
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsReserveExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-surface hover:bg-line/70 text-ink border border-line transition-colors cursor-pointer active:scale-[0.985]"
                    aria-expanded={isReserveExpanded}
                  >
                    <span>{isReserveExpanded ? "Hide reserve" : `Show reserve (${sortedReserve.length})`}</span>
                    <span className="text-muted text-[11px]">{isReserveExpanded ? "▴" : "▾"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <h3 id="posts-grid-heading" className="sr-only">All posts</h3>
            )}

            {/* When on 'needs' tab without query, grid is collapsed by default until toggled */}
            {(show !== "needs" || q || isReserveExpanded) && (
              <ul className="columns-2 gap-5 sm:columns-3 lg:columns-4">
                {(show === "needs" && !q && curated.length > 0 ? sortedReserve : list).map((post) => {
                  const live = post.status === "PUBLISHED" ? liveLinks(post, channels?.blog ?? true)[0] : undefined;
                  return (
                    <li key={post.id} className="mb-7 break-inside-avoid">
                      <PostCardPeek
                        post={post}
                        timeZone={tz}
                        nextSlot={nextSlot}
                        onSchedule={handleSchedulePost}
                        onDelete={handleDeletePost}
                        isScheduling={schedulingId === post.id}
                        liveLink={live}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      <Toast message={toast.message} position="lifted" />

      <QuickDraftDrawer
        isOpen={isQuickDraftOpen}
        onClose={() => setIsQuickDraftOpen(false)}
        onDraftStarted={() => {
          toast.show("Draft started. It will appear here shortly.");
          setTimeout(() => void assets.reload(), 3000);
        }}
        onFailed={(msg) => toast.show(msg, 5000)}
      />
    </div>
  );
}
