"use client";

import { failureSummary } from "@/lib/publishFailures";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useApiResource } from "@/hooks/useApiResource";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { buildWeek, greeting, failedPosts, recentlyPosted, slotLabel, waitingForYou, spotlightPost, todayHeadline, todaySchedulePayload, type WeekDay } from "@/lib/today";
import { nextFreeSlot } from "@/lib/drafts/nextSlot";
import { MIN_LEAD_MINUTES } from "@/lib/postTime";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardTitle, PageHeader, SectionHeader, StatusLabel } from "@/components/ui/Text";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import WeeklyPulseCard from "@/components/pulse/WeeklyPulseCard";
import PostThumb from "@/components/posts/PostThumb";
import QuickDraftDrawer from "@/components/posts/QuickDraftDrawer";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/api-client";
import type { AssetItem } from "@/types";

function TodaySkeleton() {
  return (
    <SkeletonGroup label="Loading today" className="mx-auto max-w-[1040px] space-y-14">
      <div className="space-y-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-12 w-80 max-w-full" /></div>
      <Skeleton className="h-72 w-full rounded-[28px]" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    </SkeletonGroup>
  );
}

const dayText = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso)).replace(/,/g, "");

/** Today: greeting, the one decision waiting (or all caught up), this week, and what went out. */
export default function TodayView() {
  const { data: session } = useSession();
  const assets = useApiResource<AssetItem[]>("/api/assets", [], { errorMessage: "Could not load your posts" });
  const schedule = useApiResource<{ timezone?: string } | null>("/api/schedule", null);
  const preview = useApiResource<{ slots: string[] }>("/api/schedule/preview?count=14", { slots: [] });

  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSlot, setScheduledSlot] = useState<string | null>(null);
  const [isQuickDraftOpen, setIsQuickDraftOpen] = useState(false);
  const toast = useToast(3500);

  const tz = schedule.data?.timezone || DEFAULT_TIMEZONE;
  // Read once per render; the page is short-lived and refetches on focus elsewhere.
  const now = useMemo(() => new Date(), []);
  const waiting = waitingForYou(assets.data);
  const currentSpotlight = waiting.length > 0 ? (spotlightPost(waiting, spotlightIndex) ?? waiting[0]) : null;
  const posted = recentlyPosted(assets.data, 3);
  const failed = failedPosts(assets.data);
  const week = buildWeek(now, tz, assets.data, preview.data.slots);
  const taken = assets.data.filter((a) => a.status === "SCHEDULED" && a.scheduled_for).map((a) => a.scheduled_for!);
  const nextSlot = nextFreeSlot(preview.data.slots, taken, now.getTime(), MIN_LEAD_MINUTES);
  const firstName = session?.user?.name?.split(" ")[0];
  const dateLine = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(now);

  const handleInlineSchedule = async () => {
    if (!currentSpotlight || !nextSlot || isScheduling) return;
    setIsScheduling(true);
    const { date, time } = todaySchedulePayload(nextSlot, tz);
    const slotText = slotLabel(nextSlot, tz);

    try {
      await apiClient.post(`/api/assets/${currentSpotlight.id}/schedule`, { date, time });
      setScheduledSlot(slotText);
      window.dispatchEvent(new Event("minions-counts-updated"));
      toast.show(`Scheduled for ${slotText}`);
      void assets.reload();
    } catch {
      toast.show("Could not schedule post. Please try again.");
    } finally {
      setIsScheduling(false);
    }
  };

  if (assets.isLoading) return <TodaySkeleton />;

  return (
    <div className="mx-auto max-w-[1040px] space-y-14">
      <PageHeader kicker={dateLine} title={`${greeting(now, tz)}${firstName ? `, ${firstName}` : ""}.`} />

      {assets.error ? (
        <Card as="section" pad="lg">
          <CardTitle>We couldn&apos;t load your posts.</CardTitle>
          <p className="mt-3 text-[17px] text-muted">{assets.error}</p>
          <button type="button" onClick={() => void assets.reload()} className={buttonStyles({ size: "lg", className: "mt-6" })}>
            Try again
          </button>
        </Card>
      ) : scheduledSlot ? (
        <Card as="section" pad="lg" className="space-y-4">
          <StatusLabel tone="success">Scheduled</StatusLabel>
          <CardTitle>Your post is scheduled for {scheduledSlot}.</CardTitle>
          <p className="text-[17px] leading-relaxed text-muted">
            {nextSlot
              ? `Minions will prepare your next draft before ${slotLabel(nextSlot, tz)}.`
              : "You're all caught up for today."}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/posts" className={buttonStyles({ variant: "soft", size: "lg" })}>
              View in Posts
            </Link>
          </div>
        </Card>
      ) : currentSpotlight ? (
        <Card as="section" pad="lg" aria-labelledby="spotlight-title" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 sm:gap-10 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex items-center gap-3">
              <StatusLabel tone="coral">Ready for your OK</StatusLabel>
              {waiting.length > 1 && (
                <span className="text-[13px] text-muted">
                  Draft {((spotlightIndex % waiting.length) + 1)} of {waiting.length}
                </span>
              )}
            </div>

            <CardTitle id="spotlight-title">
              {todayHeadline(nextSlot, tz)}
            </CardTitle>

            <h3 className="text-[19px] font-semibold tracking-tight text-ink leading-snug line-clamp-2">
              {currentSpotlight.title}
            </h3>

            {currentSpotlight.hook && (
              <p className="text-[16px] italic leading-relaxed text-muted line-clamp-2 border-l-2 border-line pl-3">
                “{currentSpotlight.hook.replace(/^["']|["']$/g, "")}”
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {nextSlot ? (
                <button
                  type="button"
                  onClick={() => void handleInlineSchedule()}
                  disabled={isScheduling}
                  className={buttonStyles({ size: "lg" })}
                >
                  {isScheduling ? "Scheduling..." : `Approve for ${slotLabel(nextSlot, tz)}`}
                </button>
              ) : (
                <Link href={`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`} className={buttonStyles({ size: "lg" })}>
                  Review now
                </Link>
              )}

              <Link
                href={`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`}
                className={buttonStyles({ variant: "soft", size: "lg" })}
              >
                Edit in Studio
              </Link>
            </div>

            {waiting.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[14px] text-muted">
                <button
                  type="button"
                  onClick={() => setSpotlightIndex((prev) => (prev + 1) % waiting.length)}
                  className="text-brand hover:underline cursor-pointer"
                >
                  Swap angle →
                </button>
                <span>·</span>
                <Link href="/posts" className="hover:text-ink hover:underline">
                  Browse all {waiting.length} in Posts
                </Link>
              </div>
            )}
          </div>

          <div className="w-[180px] sm:w-[220px] shrink-0 self-center md:self-auto" aria-hidden="true">
            <PostThumb post={currentSpotlight} className="shadow-md rounded-[18px] transition-transform hover:scale-[1.01]" />
          </div>
        </Card>
      ) : (
        <Card as="section" pad="lg">
          <StatusLabel tone="success">All caught up</StatusLabel>
          <CardTitle className="mt-4">Nothing needs you right now.</CardTitle>
          <p className="mt-3 text-[17px] leading-relaxed text-muted">
            {nextSlot
              ? `Minions will have the next post ready for you before ${slotLabel(nextSlot, tz)}.`
              : "Set a posting schedule and Minions will have drafts ready for you."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/posts" className={buttonStyles({ variant: "soft", size: "lg" })}>Browse post library</Link>
            <button
              type="button"
              onClick={() => setIsQuickDraftOpen(true)}
              className={buttonStyles({ variant: "secondary", size: "lg", className: "min-h-11 cursor-pointer" })}
            >
              + Draft from a thought or link
            </button>
            {!nextSlot && <Link href="/schedule" className="text-[17px] text-brand hover:underline">Set publishing pace</Link>}
          </div>
        </Card>
      )}

      {failed.length > 0 && (
        <Card as="section" pad="lg" role="alert" aria-labelledby="failed" className="flex flex-col gap-3">
          <StatusLabel tone="coral">Didn&apos;t go out</StatusLabel>
          <CardTitle id="failed">{failed.length === 1 ? "1 post didn't reach every channel." : `${failed.length} posts didn't reach every channel.`}</CardTitle>
          <p className="text-[17px] text-muted">{failed[0].title}: {failureSummary(failed[0].publish_failures)}. Open it to try again.</p>
          <Link href={`/editorial?id=${encodeURIComponent(failed[0].id)}`} className={buttonStyles({ size: "lg", className: "self-start" })}>Fix it</Link>
        </Card>
      )}

      <section aria-labelledby="week" className="space-y-5">
        <SectionHeader id="week" title="This week" href="/posts" linkLabel="All posts" />
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {week.map((day) => <DayTile key={day.key} day={day} />)}
        </ol>
      </section>

      {/* The weekly question and the story bank: asked after the main decision, never above it. */}
      <div className="empty:hidden">
        <WeeklyPulseCard />
      </div>

      {posted.length > 0 && (
        <section aria-labelledby="recent" className="space-y-2">
          <div className="mb-3"><SectionHeader id="recent" title="Recently posted" /></div>
          <ul>
            {posted.map((post) => (
              <li key={post.id} className="border-b border-line">
                <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 hover:opacity-80">
                  <span className="min-w-0 text-[17px] text-ink">{post.title}</span>
                  <span className={`shrink-0 text-[15px] ${failureSummary(post.publish_failures) ? "text-danger" : "text-muted"}`}>
                    {failureSummary(post.publish_failures) ?? (post.linkedin_url ? "LinkedIn" : post.live_blog_url ? "Blog" : "Posted")} · {dayText(post.published_at!, tz)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Toast message={toast.message} position="lifted" />

      <QuickDraftDrawer
        isOpen={isQuickDraftOpen}
        onClose={() => setIsQuickDraftOpen(false)}
        onDraftStarted={() => {
          toast.show("Draft started. It will appear here once ready.");
          setTimeout(() => void assets.reload(), 3000);
        }}
        onFailed={(msg) => toast.show(msg, 5000)}
      />
    </div>
  );
}

function DayTile({ day }: { day: WeekDay }) {
  const first = day.items[0];
  const weekend = day.weekday === "Sat" || day.weekday === "Sun";
  const label = !first
    ? { text: "·", cls: "text-muted", title: undefined }
    : first.kind === "slot"
      ? { text: first.time, cls: "text-muted", title: `Open posting time ${first.time}` }
      : first.kind === "scheduled"
        ? { text: first.time, cls: "font-semibold text-success", title: `Scheduled: ${first.title}` }
        : { text: "Posted", cls: "text-muted", title: `Posted: ${first.title}` };
  return (
    <li
      title={label.title}
      aria-current={day.isToday ? "date" : undefined}
      className={`min-w-0 rounded-2xl px-1 py-3.5 text-center sm:px-2 ${weekend && !day.isToday ? "bg-surface-2" : "bg-surface"} ${day.isToday ? "shadow-[0_0_0_2px_var(--color-ink)]" : ""}`}
    >
      <p className="text-[13px] text-muted">{day.weekday}</p>
      <p className={`mt-1 text-xl font-semibold ${weekend && !day.isToday ? "text-muted" : "text-ink"}`}>{day.day}</p>
      <p className={`mt-1.5 truncate text-xs ${label.cls}`}>{label.text}</p>
    </li>
  );
}
