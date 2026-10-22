"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  ChevronRight,
  Globe,
  CalendarClock,
  Lightbulb,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import WeeklyPulseCard from "@/components/pulse/WeeklyPulseCard";
import { formatDate } from "@/utils/date";
import { AssetItem, IdeaItem, PublishedPostRecord } from "@/types";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useChannelSummary } from "@/hooks/useChannelSummary";

const POSTING_THOUGHTS = [
  "One useful idea today. Another tomorrow.",
  "Show up often enough to become familiar.",
  "A clear point of view is easier to remember.",
  "Say one thing well. Leave room for the next post.",
  "Small insights can start important conversations.",
  "Be useful today. Be there again tomorrow.",
  "Publish, learn, and improve the next post.",
  "Share what experience taught you, not just what you know.",
  "A strong perspective gives people something to consider.",
  "Turn your experience into a lesson someone can use.",
  "Name the problem others feel but cannot yet explain.",
  "Specific ideas give people a reason to trust you.",
  "Expertise sounds stronger as an observation than a claim.",
] as const;

const THOUGHT_STORAGE_KEY = "minions.previousThought";

function pickThoughtForRefresh(): number {
  let previous = -1;
  try {
    const stored = window.sessionStorage.getItem(THOUGHT_STORAGE_KEY);
    previous = stored === null ? -1 : Number(stored);
  } catch {
    // Private browsing may block storage; the quote can still rotate.
  }

  const hasPrevious = Number.isInteger(previous) && previous >= 0 && previous < POSTING_THOUGHTS.length;
  const index = hasPrevious
    ? (previous + 1 + Math.floor(Math.random() * (POSTING_THOUGHTS.length - 1))) % POSTING_THOUGHTS.length
    : Math.floor(Math.random() * POSTING_THOUGHTS.length);

  try {
    window.sessionStorage.setItem(THOUGHT_STORAGE_KEY, String(index));
  } catch {
    // Storage is optional.
  }
  return index;
}

// The server and hydration render the same placeholder. The browser chooses
// once per page load, and refreshes never repeat the immediately prior quote.
const browserThoughtIndex = typeof window === "undefined" ? null : pickThoughtForRefresh();
const subscribeToThought = () => () => {};
const getBrowserThought = () => browserThoughtIndex;
const getServerThought = () => null;

export default function MissionControlPage() {
  const thoughtIndex = React.useSyncExternalStore(subscribeToThought, getBrowserThought, getServerThought);
  const { brandSettings } = useBrandSettings();
  const channels = useChannelSummary();
  const showLiveBlog = channels?.blog === true && Boolean(brandSettings?.company_domain?.trim());
  const ideasResource = useApiResource<IdeaItem[]>("/api/ideas", [], {
    errorMessage: "Could not load ideas",
  });
  const assetsResource = useApiResource<AssetItem[]>("/api/assets", [], {
    errorMessage: "Could not load assets",
  });
  // The live blog is the same source the sidebar badge and the Published Posts
  // page count, so the three cannot disagree about what "published" means.
  const publishedResource = useApiResource<PublishedPostRecord[]>("/api/published", [], {
    errorMessage: "Could not load published posts",
  });

  const ideas = ideasResource.data;
  const assets = assetsResource.data;
  const published = publishedResource.data;
  const isLoading = ideasResource.isLoading || assetsResource.isLoading || publishedResource.isLoading;

  const pendingReviewAssets = assets.filter((a) => a.status === "PENDING_REVIEW");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const ideasToday = ideas.filter((i) => new Date(i.created_at).getTime() >= startOfToday.getTime());

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HERO / WELCOME HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9] break-words">
            Your workspace
          </h1>
          <div className="text-sm text-[#94A3B8] mt-1 break-words max-w-xl">
            {isLoading ? <Skeleton className="mt-1 h-4 w-64 max-w-full" /> : pendingReviewAssets.length > 0 ? `${pendingReviewAssets.length} draft${pendingReviewAssets.length === 1 ? "" : "s"} ready for your review.` : "You're all caught up. Explore ideas or check what's published."}
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 lg:flex lg:w-auto lg:items-center lg:gap-2.5">
          <Link
            href="/editorial?schedule=1"
            aria-label="Open Schedule"
            className="flex min-h-12 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#1F2D3D] bg-[#0F1419] px-1.5 py-3 text-[11px] font-semibold text-[#F1F5F9] shadow-sm transition-all hover:border-[#00C9A7]/40 hover:bg-[#161D26] active:scale-[0.98] sm:gap-2 sm:px-4 sm:text-xs lg:w-auto lg:flex-none"
          >
            <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#38BDF8]" />
            <span>Schedule</span>
          </Link>

          <Link
            href="/ideas"
            aria-label="Open the Idea Directory"
            className="flex min-h-12 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#00C9A7]/25 bg-[#00C9A7]/[0.07] px-1.5 py-3 text-[11px] font-semibold text-[#B8F5E9] shadow-sm transition-all hover:border-[#00C9A7]/45 hover:bg-[#00C9A7]/[0.12] active:scale-[0.98] sm:gap-2 sm:px-4 sm:text-xs lg:w-auto lg:flex-none"
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#00C9A7]" />
            <span>Directory</span>
          </Link>

          <Link
            href="/editorial"
            aria-label={`Open Editor: ${pendingReviewAssets.length} items to review`}
            className="flex min-h-12 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#00C9A7] px-1.5 py-3 text-[11px] font-bold text-[#070B0F] shadow-lg shadow-[#00C9A7]/20 transition-all hover:bg-[#00A88A] active:scale-[0.98] sm:gap-2 sm:px-4 sm:text-xs lg:w-auto lg:flex-none"
          >
            <FileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span>Editor{isLoading ? "" : ` (${pendingReviewAssets.length})`}</span>
          </Link>
        </div>
      </div>

      <aside
        className="group relative isolate overflow-hidden rounded-[1.75rem] border border-[#00C9A7]/35 bg-[linear-gradient(135deg,#10201e_0%,#0f1719_48%,#10151b_100%)] p-1 shadow-[0_10px_0_#08100f,0_24px_60px_-36px_rgba(0,201,167,0.75)]"
        aria-label="Daily spark"
      >
        <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#00C9A7]/12 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-5 right-8 text-[8rem] font-black leading-none text-[#00C9A7]/[0.045] sm:text-[11rem]" aria-hidden="true">
          “
        </span>

        <div className="relative min-h-[210px] rounded-[1.5rem] border border-white/[0.035] bg-[#0D1418]/75 px-5 py-6 sm:min-h-[230px] sm:px-8 sm:py-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#38E8C7]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00C9A7]/25 bg-[#00C9A7]/12 shadow-[0_4px_0_rgba(0,0,0,0.28)]">
                <Lightbulb className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span>
                <span className="block">Daily spark</span>
                <span className="mt-0.5 block text-[10px] font-semibold normal-case tracking-normal text-[#8CA5A0]">A thought for today</span>
              </span>
            </p>
            <span className="rounded-full border border-[#00C9A7]/20 bg-[#00C9A7]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#70EBD4]">
              Today
            </span>
          </div>

          <blockquote
            className="relative mt-7 max-w-5xl text-[clamp(1.7rem,4.2vw,3.25rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#F4F8F7] sm:mt-8"
            aria-busy={thoughtIndex === null}
          >
            {thoughtIndex === null
              ? (
                <span className="space-y-3" aria-hidden="true">
                  <span className="block h-8 w-11/12 animate-pulse rounded-xl bg-white/[0.07] sm:h-11" />
                  <span className="block h-8 w-2/3 animate-pulse rounded-xl bg-white/[0.05] sm:h-11" />
                </span>
              )
              : <>{POSTING_THOUGHTS[thoughtIndex]}</>}
          </blockquote>
        </div>
      </aside>

      {/* THE WEEKLY QUESTION (phase 6): shown only on the weeks it is open */}
      <WeeklyPulseCard />

      {/* TOP STAT TILES ROW (3 KPI TILES) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>IDEAS FOUND</span>
            <Sparkles className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            {isLoading ? <Skeleton className="h-8 w-20" /> : <>
              <span>{ideas.length}</span>
              <span className="text-xs font-normal text-[#00C9A7] font-mono">+{ideasToday.length} today</span>
            </>}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Topics you can turn into posts
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#ff6b4a]/30 space-y-2 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff6b4a]/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-mono text-[#ff6b4a]">
            <span>PENDING REVIEW</span>
            <span className="w-2 h-2 rounded-full bg-[#ff6b4a] animate-ping" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            {isLoading ? <Skeleton className="h-8 w-12" /> : <span>{pendingReviewAssets.length}</span>}
            {!isLoading && pendingReviewAssets.length > 0 && (
              <span className="text-xs font-semibold text-[#ff6b4a] bg-[#ff6b4a]/10 px-2 py-0.5 rounded">Action Required</span>
            )}
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Drafts waiting for your decision
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>PUBLISHED POSTS</span>
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            {isLoading ? <Skeleton className="h-8 w-12" /> : <span>{published.length}</span>}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Published articles
          </div>
        </div>
      </div>

      {/* MAIN FULL-WIDTH COCKPIT SECTIONS */}
      <div className="space-y-8">
        {/* PENDING REVIEW QUEUE */}
        <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F2D3D] pb-3 gap-3">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2 break-words">
                <FileText className="w-4 h-4 text-[#ff6b4a] shrink-0" />
                Drafts to review
              </h2>
              <p className="text-xs text-[#94A3B8] break-words">Read each draft and make it yours before publishing.</p>
            </div>
            <span className="text-xs font-mono text-[#ff6b4a] font-bold bg-[#ff6b4a]/10 px-2 py-0.5 rounded border border-[#ff6b4a]/20 shrink-0 self-start sm:self-auto">
              {isLoading ? "Checking" : `${pendingReviewAssets.length} Draft${pendingReviewAssets.length === 1 ? "" : "s"} Waiting`}
            </span>
          </div>

          {isLoading ? (
            <LoadingState label="Loading drafts to review…" rows={2} />
          ) : pendingReviewAssets.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#161D26] border border-dashed border-[#1F2D3D] text-[#00C9A7]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#00C9A7]" />
              <p className="text-sm font-bold">All clear — no drafts waiting for review</p>
              <p className="text-xs text-[#94A3B8] mt-1">When a draft is ready, you’ll find it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] hover:border-[#00C9A7]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full">
                    {/* 48x48 Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-[#0F1419] border border-[#1F2D3D] shrink-0 overflow-hidden flex items-center justify-center">
                      {asset.hero_image_url ? (
                        <Image
                          src={asset.hero_image_url}
                          alt={asset.title}
                          width={48}
                          height={48}
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0e5c63]/20 text-[#00C9A7] font-mono text-sm font-bold">
                          {(asset.title || "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#ff6b4a]/10 text-[#ff6b4a] border border-[#ff6b4a]/20 shrink-0">
                          Ready for review
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                          asset.audience === "ICP" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                        }`}>
                          {asset.audience}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#F1F5F9] line-clamp-2 break-words group-hover:text-[#00C9A7] transition-colors">
                        {asset.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] line-clamp-2 break-words">
                        {asset.hook || asset.body_content?.slice(0, 100)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                    <Link
                      href="/editorial"
                      className="px-4 py-2 rounded-xl bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold transition-all shadow-md shadow-[#00C9A7]/10 flex items-center gap-1.5"
                    >
                      <span>Review in Studio</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LIVE OMNICHANNEL BROADCASTS */}
        {showLiveBlog && <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F2D3D] pb-3 gap-3">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2 break-words">
                <Globe className="w-4 h-4 text-[#00C9A7] shrink-0" />
                Published articles
              </h2>
              <p className="text-xs text-[#94A3B8] break-words">Your recent posts, all in one place.</p>
            </div>
            <Link
              href="/published"
              className="text-xs font-mono text-[#00C9A7] hover:underline flex items-center gap-1"
            >
              <span>View all posts →</span>
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading && <LoadingState label="Loading broadcasts…" />}
            {!isLoading && published.length === 0 && (
              <EmptyState
                title="Nothing published yet"
                description="Approved drafts appear here once they go live on the blog."
              />
            )}
            {published.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-start sm:items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-[#00C9A7] mt-1 sm:mt-0 shrink-0"></span>
                    <span className="text-xs font-bold text-[#F1F5F9] break-words line-clamp-2">{post.title}</span>
                    <span className="text-[10px] font-mono text-[#64748B] shrink-0">({post.audience})</span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] flex items-center gap-2 flex-wrap font-mono">
                    <span className="shrink-0">Published {formatDate(post.published_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {post.published_url && (
                    <a
                      href={post.published_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-xs font-medium text-[#F1F5F9] hover:bg-[#1E2733] flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3 h-3 text-[#00C9A7]" />
                      <span>Read on blog ↗</span>
                    </a>
                  )}
                  <Link
                    href="/published"
                    className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E2733] transition-colors"
                  >
                    Channels →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
}
