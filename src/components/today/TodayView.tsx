"use client";

import { failureSummary } from "@/lib/publishFailures";
import React, { useMemo, useState } from "react";
import { autopilotOffered } from "@/lib/plan/ahead";
import { linkedinNudge, type LinkedInHealth } from "@/lib/linkedinHealth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";
import { liveLinks } from "@/lib/drafts/liveLinks";
import { useApiResource } from "@/hooks/useApiResource";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import {
  buildWeek,
  greeting,
  failedPosts,
  recentlyPosted,
  slotLabel,
  waitingForYou,
  spotlightPost,
  todaySchedulePayload,
  postChannels,
  postFormatLabel,
  postTopicSnippet,
  scheduledForToday,
  type WeekDay,
} from "@/lib/today";
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
import { track } from "@/lib/analytics";
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
  const router = useRouter();
  const { data: session } = useSession();
  const assets = useApiResource<AssetItem[]>("/api/assets", [], { errorMessage: "Could not load your posts" });
  const schedule = useApiResource<{ timezone?: string; require_review?: boolean; created_at?: string; linkedin?: LinkedInHealth } | null>("/api/schedule", null);
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
  const scheduledToday = scheduledForToday(assets.data, now, tz);
  const posted = recentlyPosted(assets.data, 3);
  const failed = failedPosts(assets.data);
  const week = buildWeek(now, tz, assets.data, preview.data.slots);
  const taken = assets.data.filter((a) => a.status === "SCHEDULED" && a.scheduled_for).map((a) => a.scheduled_for!);
  const nextSlot = nextFreeSlot(preview.data.slots, taken, now.getTime(), MIN_LEAD_MINUTES);
  const offerAutopilot = schedule.data?.created_at ? autopilotOffered(new Date(schedule.data.created_at), schedule.data.require_review === true, now) : false;
  const linkedinLine = schedule.data?.linkedin ? linkedinNudge(schedule.data.linkedin) : null;
  const firstName = session?.user?.name?.split(" ")[0];
  const dateLine = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(now);

  const handleInlineSchedule = async () => {
    if (!currentSpotlight || !nextSlot || isScheduling) return;
    setIsScheduling(true);
    const { date, time } = todaySchedulePayload(nextSlot, tz);
    const slotText = slotLabel(nextSlot, tz);

    try {
      await apiClient.post(`/api/assets/${currentSpotlight.id}/schedule`, { date, time });
      track("post_approved", { method: "scheduled" });
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
        <Card
          as="section"
          pad="lg"
          role="button"
          tabIndex={0}
          title="Click to view scheduled post in Studio"
          onClick={() => {
            if (currentSpotlight) {
              router.push(`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`);
            } else {
              router.push("/posts?show=scheduled");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (currentSpotlight) {
                router.push(`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`);
              } else {
                router.push("/posts?show=scheduled");
              }
            }
          }}
          className="group relative cursor-pointer space-y-4 transition-all duration-200 hover:border-ink/25 hover:shadow-xl"
        >
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <StatusLabel tone="success">Scheduled</StatusLabel>
            <span>·</span>
            <span>{scheduledSlot}</span>
          </div>
          <CardTitle>Your post is scheduled for {scheduledSlot}.</CardTitle>
          <p className="text-[17px] leading-relaxed text-muted">
            {nextSlot
              ? `Minions will prepare your next draft before ${slotLabel(nextSlot, tz)}.`
              : "You're all caught up for today."}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2" onClick={(e) => e.stopPropagation()}>
            <Link href="/posts" onClick={(e) => e.stopPropagation()} className={buttonStyles({ variant: "soft", size: "lg" })}>
              View in Posts
            </Link>
            <span className="text-[14px] text-muted group-hover:text-ink transition-colors">
              Click to edit in Studio ↗
            </span>
          </div>
        </Card>
      ) : currentSpotlight ? (
        <Card
          as="section"
          pad="lg"
          aria-labelledby="spotlight-title"
          role="button"
          tabIndex={0}
          title="Click anywhere on card to open in edit mode"
          onClick={() => router.push(`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`);
            }
          }}
          className="group relative cursor-pointer flex flex-col md:flex-row items-stretch justify-between gap-8 sm:gap-10 overflow-hidden transition-all duration-200 hover:border-ink/25 hover:shadow-xl"
        >
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-5">
            <div className="space-y-4">
              {/* Single confident post headline */}
              <h2 id="spotlight-title" className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-ink leading-snug group-hover:text-brand transition-colors">
                {currentSpotlight.title}
              </h2>

              {/* Single punchy hook excerpt */}
              {currentSpotlight.hook && (
                <p className="text-[15px] sm:text-[16px] italic leading-relaxed text-muted line-clamp-3 border-l-2 border-line pl-3.5">
                  “{currentSpotlight.hook.replace(/^["']|["']$/g, "")}”
                </p>
              )}
            </div>

            <div className="space-y-4 pt-1">
              {/* Single primary button + quiet Studio edit affordance */}
              <div className="flex flex-wrap items-center gap-4" onClick={(e) => e.stopPropagation()}>
                {nextSlot ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleInlineSchedule();
                    }}
                    disabled={isScheduling}
                    className={buttonStyles({ size: "lg" })}
                  >
                    {isScheduling ? "Scheduling..." : `Approve for ${slotLabel(nextSlot, tz)}`}
                  </button>
                ) : (
                  <Link
                    href={`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`}
                    onClick={(e) => e.stopPropagation()}
                    className={buttonStyles({ size: "lg" })}
                  >
                    Review in Studio
                  </Link>
                )}

                <Link
                  href={`/editorial?id=${encodeURIComponent(currentSpotlight.id)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-ink transition-colors"
                >
                  <span>Edit in Studio</span>
                  <span className="text-[12px] opacity-70">↗</span>
                </Link>
              </div>

              {/* Minimal, uncluttered angle switcher */}
              {waiting.length > 1 && (
                <div
                  className="flex flex-wrap items-center gap-2 pt-2 text-[13px] text-muted border-t border-line/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Angle:</span>
                  <span className="font-medium text-ink">
                    {postTopicSnippet(currentSpotlight) || `#${(spotlightIndex % waiting.length) + 1}`}
                  </span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpotlightIndex((prev) => (prev + 1) % waiting.length);
                    }}
                    className="font-medium text-brand hover:underline cursor-pointer"
                  >
                    Swap angle →
                  </button>
                  <span>·</span>
                  <Link
                    href="/posts"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-ink hover:underline"
                  >
                    Browse all {waiting.length} in Posts
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Generously sized poster container (320px–340px) to balance layout and showcase cover art */}
          <div className="w-full sm:w-[280px] md:w-[320px] lg:w-[340px] shrink-0 self-center md:self-stretch flex items-center justify-center" aria-hidden="true">
            <PostThumb post={currentSpotlight} className="w-full shadow-lg rounded-[22px] transition-transform duration-300 group-hover:scale-[1.015]" />
          </div>
        </Card>
      ) : scheduledToday ? (
        <Card
          as="section"
          pad="lg"
          aria-labelledby="scheduled-today-title"
          role="button"
          tabIndex={0}
          title="Click anywhere on card to open in edit mode"
          onClick={() => router.push(`/editorial?id=${encodeURIComponent(scheduledToday.id)}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/editorial?id=${encodeURIComponent(scheduledToday.id)}`);
            }
          }}
          className="group relative cursor-pointer flex flex-col md:flex-row items-stretch justify-between gap-8 sm:gap-10 overflow-hidden transition-all duration-200 hover:border-ink/25 hover:shadow-xl"
        >
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                <StatusLabel tone="success">Scheduled for today</StatusLabel>
                <span>·</span>
                <span className="font-medium text-success">
                  {scheduledToday.scheduled_for ? slotLabel(scheduledToday.scheduled_for, tz) : "Today"}
                </span>
                <span>·</span>
                <span>{postFormatLabel(scheduledToday)}</span>
                <span>·</span>
                <span>{postChannels(scheduledToday).join(", ")}</span>
              </div>

              <h2 id="scheduled-today-title" className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-ink leading-snug group-hover:text-brand transition-colors">
                {scheduledToday.title}
              </h2>

              {scheduledToday.hook && (
                <p className="text-[15px] sm:text-[16px] italic leading-relaxed text-muted line-clamp-3 border-l-2 border-line pl-3.5">
                  “{scheduledToday.hook.replace(/^["']|["']$/g, "")}”
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1" onClick={(e) => e.stopPropagation()}>
              <Link
                href="/posts?show=scheduled"
                onClick={(e) => e.stopPropagation()}
                className={buttonStyles({ size: "lg" })}
              >
                View in Posts
              </Link>
              <Link
                href={`/editorial?id=${encodeURIComponent(scheduledToday.id)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-ink transition-colors"
              >
                <span>Edit in Studio</span>
                <span className="text-[12px] opacity-70">↗</span>
              </Link>
            </div>
          </div>

          <div className="w-full sm:w-[280px] md:w-[320px] lg:w-[340px] shrink-0 self-center md:self-stretch flex items-center justify-center" aria-hidden="true">
            <PostThumb post={scheduledToday} className="w-full shadow-lg rounded-[22px] transition-transform duration-300 group-hover:scale-[1.015]" />
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
            {linkedinLine && (
              <span className="text-[17px] text-muted">
                {linkedinLine.text}{" "}
                <Link href="/fleet" className="text-brand hover:underline">{linkedinLine.action}</Link>
              </span>
            )}
            {nextSlot && offerAutopilot && !linkedinLine && <Link href="/schedule" className="text-[17px] text-brand hover:underline">Ready for Autopilot? Posts go out without review.</Link>}
          </div>
        </Card>
      )}

      {failed.length > 0 && (
        <Card
          as="section"
          pad="lg"
          role="alert"
          aria-labelledby="failed"
          onClick={() => router.push(`/editorial?id=${encodeURIComponent(failed[0].id)}`)}
          className="group relative cursor-pointer flex flex-col gap-3 transition-all duration-200 hover:border-ink/25 hover:shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <StatusLabel tone="coral">Didn&apos;t go out</StatusLabel>
            <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-surface-2/60 px-3 py-1 text-[12px] font-medium text-muted transition-all duration-200 group-hover:border-ink/30 group-hover:bg-ink group-hover:text-surface group-hover:shadow-sm">
              <span>Click card to retry</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">↗</span>
            </div>
          </div>
          <CardTitle id="failed">{failed.length === 1 ? "1 post didn't reach every channel." : `${failed.length} posts didn't reach every channel.`}</CardTitle>
          <p className="text-[17px] text-muted">{failed[0].title}: {failureSummary(failed[0].publish_failures)}. Open it to try again.</p>
          <div onClick={(e) => e.stopPropagation()}>
            <Link href={`/editorial?id=${encodeURIComponent(failed[0].id)}`} className={buttonStyles({ size: "lg", className: "self-start" })}>Fix it</Link>
          </div>
        </Card>
      )}

      <section aria-labelledby="week" className="space-y-5">
        <SectionHeader id="week" title="This week" href="/posts" linkLabel="All posts" />
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {week.map((day) => (
            <DayTile
              key={day.key}
              day={day}
              onSelect={(id) => router.push(`/editorial?id=${encodeURIComponent(id)}`)}
            />
          ))}
        </ol>
      </section>

      {/* The weekly question and the story bank: asked after the main decision, never above it. */}
      <div className="empty:hidden">
        <WeeklyPulseCard />
      </div>

      {posted.length > 0 && (
        <section aria-labelledby="recent" className="space-y-4">
          <SectionHeader id="recent" title="Recently posted" href="/posts?show=posted" linkLabel="All posted" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-5">
            {posted.map((post) => {
              const failure = failureSummary(post.publish_failures);
              const live = liveLinks(post, true)[0];
              const channelLabel = failure ?? (post.linkedin_url ? "LinkedIn" : post.live_blog_url ? "Blog" : "Posted");
              return (
                <div
                  key={post.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-line bg-surface p-3.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg focus-within:-translate-y-1.5 focus-within:shadow-lg"
                >
                  <div>
                    {/* Top Metadata & Live Link */}
                    <div className="flex items-center justify-between gap-2 px-0.5 pb-2.5 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${failure ? "bg-danger" : "bg-success"}`}
                          aria-hidden="true"
                        />
                        <span className={`truncate font-medium ${failure ? "text-danger" : "text-muted"}`}>
                          {channelLabel}
                        </span>
                        <span className="text-muted/60">·</span>
                        <span className="shrink-0 text-muted">{dayText(post.published_at!, tz)}</span>
                      </div>

                      {live && (
                        <a
                          href={live.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-brand transition-colors shrink-0"
                          title={`View live on ${live.label}`}
                        >
                          <span>Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Artwork / Poster Thumbnail */}
                    <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="block">
                      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[16px] bg-surface-2">
                        <PostThumb
                          post={post}
                          className="transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    </Link>
                  </div>

                  {/* Title & Hook */}
                  <div className="mt-3 space-y-1.5 px-0.5">
                    <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="block group/title">
                      <h4 className="text-[14.5px] font-semibold text-ink line-clamp-2 leading-snug group-hover/title:text-brand transition-colors">
                        {post.title}
                      </h4>
                    </Link>
                    {post.hook && (
                      <p className="text-[12.5px] text-muted line-clamp-2 italic leading-relaxed">
                        “{post.hook}”
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

function DayTile({ day, onSelect }: { day: WeekDay; onSelect?: (id: string) => void }) {
  const first = day.items[0];
  const weekend = day.weekday === "Sat" || day.weekday === "Sun";
  const isInteractive = Boolean(first && (first.kind === "scheduled" || first.kind === "posted") && "id" in first);
  const label = !first
    ? { text: "·", cls: "text-muted", title: undefined }
    : first.kind === "slot"
      ? { text: first.time, cls: "text-muted", title: `Open posting time ${first.time}` }
      : first.kind === "scheduled"
        ? { text: first.time, cls: "font-semibold text-success", title: `Scheduled: ${first.title}` }
        : { text: "Posted", cls: "text-muted", title: `Posted: ${first.title}` };
  return (
    <li
      title={isInteractive ? `${label.title} · Click to edit in Studio` : label.title}
      aria-current={day.isToday ? "date" : undefined}
      onClick={() => {
        if (isInteractive && onSelect && first && "id" in first) {
          onSelect(first.id);
        }
      }}
      className={`min-w-0 rounded-2xl px-1 py-3.5 text-center sm:px-2 transition-all ${
        weekend && !day.isToday ? "bg-surface-2" : "bg-surface"
      } ${day.isToday ? "shadow-[0_0_0_2px_var(--color-ink)]" : ""} ${
        isInteractive ? "cursor-pointer hover:border-ink/20 hover:shadow-md hover:scale-[1.02]" : ""
      }`}
    >
      <p className="text-[13px] text-muted">{day.weekday}</p>
      <p className={`mt-1 text-xl font-semibold ${weekend && !day.isToday ? "text-muted" : "text-ink"}`}>{day.day}</p>
      <p className={`mt-1.5 truncate text-xs ${label.cls}`}>{label.text}</p>
    </li>
  );
}
