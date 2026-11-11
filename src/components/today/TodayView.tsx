"use client";

import { failureSummary } from "@/lib/publishFailures";
import React, { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useApiResource } from "@/hooks/useApiResource";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { buildWeek, greeting, recentlyPosted, slotLabel, waitingForYou, type WeekDay } from "@/lib/today";
import { nextFreeSlot } from "@/lib/drafts/nextSlot";
import { MIN_LEAD_MINUTES } from "@/lib/postTime";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardTitle, PageHeader, SectionHeader, StatusLabel } from "@/components/ui/Text";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import WeeklyPulseCard from "@/components/pulse/WeeklyPulseCard";
import PostThumb from "@/components/posts/PostThumb";
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

  const tz = schedule.data?.timezone || DEFAULT_TIMEZONE;
  // Read once per render; the page is short-lived and refetches on focus elsewhere.
  const now = useMemo(() => new Date(), []);
  const waiting = waitingForYou(assets.data);
  const posted = recentlyPosted(assets.data, 3);
  const week = buildWeek(now, tz, assets.data, preview.data.slots);
  const taken = assets.data.filter((a) => a.status === "SCHEDULED" && a.scheduled_for).map((a) => a.scheduled_for!);
  const nextSlot = nextFreeSlot(preview.data.slots, taken, now.getTime(), MIN_LEAD_MINUTES);
  const firstName = session?.user?.name?.split(" ")[0];
  const dateLine = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(now);

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
      ) : waiting.length > 0 ? (
        <Card as="section" pad="lg" aria-labelledby="waiting" className="flex flex-wrap items-center gap-10 overflow-hidden">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
            <StatusLabel tone="coral">Needs you</StatusLabel>
            <CardTitle id="waiting">
              {waiting.length === 1 ? "1 post is ready for your OK." : `${waiting.length} posts are ready for your OK.`}
            </CardTitle>
            <p className="text-[17px] leading-relaxed text-muted">
              {nextSlot
                ? `The first one can go out ${slotLabel(nextSlot, tz)} once you approve it. Takes about a minute.`
                : "Nothing goes out until you approve it. Takes about a minute."}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href={`/editorial?id=${encodeURIComponent(waiting[0].id)}`} className={buttonStyles({ size: "lg" })}>
                Review now
              </Link>
              {waiting.length > 1 && (
                <Link href="/posts?show=needs" className="text-[17px] text-brand hover:underline">
                  See all {waiting.length}
                </Link>
              )}
            </div>
          </div>
          {/* Covers: the second one sits a little lower, inside the card's padding. */}
          <div className="flex min-w-0 flex-[0_1_320px] gap-3 pb-4" aria-hidden="true">
            {waiting.slice(0, 2).map((post, i) => (
              <PostThumb key={post.id} post={post} className={`flex-1 ${i === 1 ? "translate-y-4" : ""}`} />
            ))}
            {waiting.length === 1 && <div className="flex-1" />}
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
            <Link href="/ideas" className={buttonStyles({ variant: "soft", size: "lg" })}>See your ideas</Link>
            {!nextSlot && <Link href="/editorial?schedule=1" className="text-[17px] text-brand hover:underline">Set a schedule</Link>}
          </div>
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
