"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useApiResource } from "@/hooks/useApiResource";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { buildWeek, greeting, recentlyPosted, slotLabel, waitingForYou } from "@/lib/today";
import { buttonStyles } from "@/components/ui/Button";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import WeeklyPulseCard from "@/components/pulse/WeeklyPulseCard";
import PostThumb from "@/components/posts/PostThumb";
import type { AssetItem } from "@/types";

const card = "rounded-[28px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.04)]";

function TodaySkeleton() {
  return (
    <SkeletonGroup label="Loading today" className="space-y-12">
      <div className="space-y-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-12 w-80 max-w-full" /></div>
      <Skeleton className="h-64 w-full rounded-[28px]" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </SkeletonGroup>
  );
}

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
  const nextSlot = preview.data.slots.find((s) => new Date(s) > now) ?? null;
  const firstName = session?.user?.name?.split(" ")[0];
  const dateLine = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(now);

  if (assets.isLoading) return <TodaySkeleton />;

  return (
    <div className="mx-auto max-w-[1040px] space-y-14">
      <header className="space-y-2">
        <p className="text-[15px] text-muted">{dateLine}</p>
        <h1 className="text-[40px] font-bold leading-[1.08] tracking-[-0.035em] text-ink sm:text-5xl">
          {greeting(now, tz)}
          {firstName ? `, ${firstName}.` : "."}
        </h1>
      </header>

      <div className="empty:hidden">
        <WeeklyPulseCard />
      </div>

      {assets.error ? (
        <section className={`${card} p-8 sm:p-10`}>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">We couldn&apos;t load your posts.</h2>
          <p className="mt-2 text-[17px] text-muted">{assets.error}</p>
          <button type="button" onClick={() => void assets.reload()} className={buttonStyles({ className: "mt-6" })}>
            Try again
          </button>
        </section>
      ) : waiting.length > 0 ? (
        <section aria-labelledby="waiting" className={`${card} flex flex-wrap items-center gap-10 p-8 sm:p-10`}>
          <div className="min-w-0 flex-[1_1_340px] space-y-4">
            <p className="text-sm font-semibold text-coral">● Needs you</p>
            <h2 id="waiting" className="text-[32px] font-bold leading-tight tracking-[-0.025em] text-ink">
              {waiting.length === 1 ? "1 post is waiting for your OK." : `${waiting.length} posts are waiting for your OK.`}
            </h2>
            <p className="text-[17px] leading-relaxed text-muted">
              Nothing goes out until you approve it.
              {nextSlot ? ` Your next posting time is ${slotLabel(nextSlot, tz)}.` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href={`/editorial?id=${encodeURIComponent(waiting[0].id)}`} className={buttonStyles({ size: "lg" })}>
                Review now
              </Link>
              {waiting.length > 1 && (
                <Link href="/posts" className="text-[17px] text-brand hover:underline">
                  See all {waiting.length}
                </Link>
              )}
            </div>
          </div>
          <div className="flex min-w-0 flex-[0_1_300px] gap-3" aria-hidden="true">
            {waiting.slice(0, 2).map((post, i) => (
              <PostThumb key={post.id} post={post} className={`flex-1 ${i === 1 ? "translate-y-4" : ""}`} />
            ))}
          </div>
        </section>
      ) : (
        <section className={`${card} p-8 sm:p-10`}>
          <p className="text-sm font-semibold text-success">● All caught up</p>
          <h2 className="mt-4 text-[32px] font-bold leading-tight tracking-[-0.025em] text-ink">Nothing needs you right now.</h2>
          <p className="mt-3 text-[17px] leading-relaxed text-muted">
            {nextSlot
              ? `Minions will have the next post ready for you before ${slotLabel(nextSlot, tz)}.`
              : "Set a posting schedule and Minions will have drafts ready for you."}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/ideas" className={buttonStyles({ variant: "soft" })}>See your ideas</Link>
            {!nextSlot && <Link href="/editorial?schedule=1" className="self-center text-[17px] text-brand hover:underline">Set a schedule</Link>}
          </div>
        </section>
      )}

      <section aria-labelledby="week" className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="week" className="text-2xl font-semibold tracking-tight text-ink">This week</h2>
          <Link href="/posts" className="text-[15px] text-brand hover:underline">All posts ›</Link>
        </div>
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {week.map((day) => {
            const first = day.items[0];
            const label = !first
              ? null
              : first.kind === "slot"
                ? { text: first.time, cls: "text-muted", title: `Posting time ${first.time}` }
                : first.kind === "scheduled"
                  ? { text: first.time, cls: "text-success font-semibold", title: `Scheduled: ${first.title}` }
                  : { text: "Posted", cls: "text-muted", title: `Posted: ${first.title}` };
            return (
              <li
                key={day.key}
                title={label?.title}
                className={`rounded-2xl px-1 py-3 text-center ${day.isToday ? "bg-surface ring-2 ring-ink" : "bg-surface"}`}
              >
                <p className="text-[13px] text-muted">{day.weekday}</p>
                <p className="mt-1 text-xl font-semibold text-ink">{day.day}</p>
                <p className={`mt-1 h-4 truncate text-xs ${label?.cls ?? "text-line-strong"}`}>{label?.text ?? "·"}</p>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-muted">
          {week.some((d) => d.items.some((i) => i.kind === "scheduled")) ? (
            <><span className="font-semibold text-success">Green</span> times are scheduled posts; gray times are open posting times.</>
          ) : (
            "Times are your open posting times."
          )}
        </p>
      </section>

      {posted.length > 0 && (
        <section aria-labelledby="recent" className="space-y-2">
          <h2 id="recent" className="mb-3 text-2xl font-semibold tracking-tight text-ink">Recently posted</h2>
          <ul>
            {posted.map((post) => (
              <li key={post.id} className="border-b border-line last:border-0">
                <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 hover:opacity-80">
                  <span className="text-[17px] text-ink">{post.title}</span>
                  <span className="text-[15px] text-muted">
                    {post.linkedin_url ? "LinkedIn" : post.live_blog_url ? "Blog" : "Posted"} ·{" "}
                    {new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(new Date(post.published_at!))}
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
