"use client";

import React from "react";
import Link from "next/link";
import { compactSlotLabel } from "@/lib/today";
import { StatusLabel } from "@/components/ui/Text";
import PostThumb from "./PostThumb";
import type { AssetItem } from "@/types";

interface CuratedPostsTrayProps {
  posts: AssetItem[];
  nextSlot: string | null;
  timeZone: string;
  onSchedule: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  schedulingId: string | null;
}

function channelFormatLabel(post: AssetItem): string {
  const hasCarousel = Boolean(post.linkedin_went_as === "CAROUSEL" || post.carousel_pages?.length);
  const channels = post.channels?.length ? post.channels : ["LinkedIn"];
  const channelNames = channels.map((c) =>
    c.toLowerCase().includes("link") ? "LinkedIn" : c.toLowerCase().includes("insta") ? "Instagram" : c.toLowerCase().includes("face") ? "Facebook" : c
  );
  const format = hasCarousel ? "Carousel" : "Single poster";
  return `${channelNames.join(" + ")} · ${format}`;
}

/**
 * Top-3 Curated Triage Shelf: Pure poster cards by default;
 * on hover/focus, smoothly lifts up and reveals hook, Details, Delete, and non-wrapping Schedule actions.
 */
export default function CuratedPostsTray({
  posts,
  nextSlot,
  timeZone,
  onSchedule,
  onDelete,
  schedulingId,
}: CuratedPostsTrayProps) {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Mobile Swipeable Snap Shelf / Desktop 3-Column Grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posts.map((post, idx) => {
          const isBusy = schedulingId === post.id;
          const label = channelFormatLabel(post);
          const slotText = nextSlot ? compactSlotLabel(nextSlot, timeZone) : "";

          return (
            <div
              key={post.id}
              className="group relative flex flex-col justify-between w-[85vw] max-w-[330px] shrink-0 snap-center sm:w-auto sm:max-w-none overflow-hidden rounded-[22px] border border-line bg-surface p-3.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg focus-within:-translate-y-1.5 focus-within:shadow-lg"
            >
              {/* Top Badge & Delete */}
              <div className="flex items-center justify-between gap-2 px-0.5 pb-2.5">
                <div className="flex items-center gap-2 truncate">
                  <StatusLabel tone="coral">#{idx + 1} Up next</StatusLabel>
                  <span className="truncate text-[12px] font-medium text-muted">· {label}</span>
                </div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void onDelete(post.id);
                    }}
                    className="shrink-0 p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Delete draft"
                    aria-label="Delete draft"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Poster Thumbnail */}
              <div className="relative aspect-[4/5] max-h-[280px] sm:max-h-none w-full overflow-hidden rounded-[16px]">
                <PostThumb post={post} className="h-full w-full object-cover" />

                {/* Desktop Hover / Focus Overlay with Smooth Slide & Fade (Hidden on Mobile) */}
                <div className="pointer-events-none absolute inset-0 z-20 hidden md:flex flex-col justify-between bg-white/98 dark:bg-canvas/98 p-5 backdrop-blur-md shadow-xl border border-line/50 opacity-0 transition-opacity duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <div className="space-y-2.5 overflow-hidden">
                    <span className="text-[12px] font-medium text-muted">{label}</span>
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
                      {post.title}
                    </h3>

                    {post.hook && (
                      <blockquote className="border-l border-brand/40 pl-3 py-0.5 text-[13px] text-ink/85 italic leading-relaxed line-clamp-3">
                        “{post.hook.replace(/^["']|["']$/g, "")}”
                      </blockquote>
                    )}
                  </div>

                  {/* Exactly Two Buttons: High-attention Primary Schedule + Quiet Secondary Edit */}
                  <div className="flex items-center gap-2 pt-3 border-t border-line/60">
                    {nextSlot && (
                      <button
                        type="button"
                        onClick={() => void onSchedule(post.id)}
                        disabled={Boolean(schedulingId)}
                        className="group/btn flex-1 min-w-0 min-h-[42px] px-3.5 rounded-full bg-brand text-white text-[13.5px] font-medium shadow-sm hover:bg-brand/90 hover:shadow active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 transition-all flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0 opacity-90 transition-transform group-hover/btn:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{isBusy ? "Scheduling..." : `Schedule · ${slotText}`}</span>
                      </button>
                    )}

                    <Link
                      href={`/editorial?id=${encodeURIComponent(post.id)}`}
                      className="group/edit shrink-0 min-h-[42px] px-4 rounded-full bg-surface border border-line hover:border-ink/20 text-ink text-[13.5px] font-medium hover:bg-line/40 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-muted group-hover/edit:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Edit</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mobile Touch Presentation: Direct Title, Hook, and 44px Touch Targets */}
              <div className="mt-3 flex flex-col gap-2.5 md:hidden">
                <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="block">
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink hover:text-brand transition-colors">
                    {post.title}
                  </h3>
                </Link>

                {post.hook && (
                  <blockquote className="border-l border-brand/40 pl-2.5 py-0.5 text-[12.5px] text-ink/80 italic leading-relaxed line-clamp-2">
                    “{post.hook.replace(/^["']|["']$/g, "")}”
                  </blockquote>
                )}

                {/* Mobile 44px Thumb Touch Targets */}
                <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                  {nextSlot && (
                    <button
                      type="button"
                      onClick={() => void onSchedule(post.id)}
                      disabled={Boolean(schedulingId)}
                      className="group/btn flex-1 min-w-0 min-h-[44px] px-3.5 rounded-full bg-brand text-white text-[13.5px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.985] shadow-sm truncate"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{isBusy ? "Scheduling..." : `Schedule · ${slotText}`}</span>
                    </button>
                  )}
                  <Link
                    href={`/editorial?id=${encodeURIComponent(post.id)}`}
                    className="shrink-0 min-h-[44px] px-4 rounded-full bg-surface border border-line text-ink text-[13.5px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.985]"
                  >
                    <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Edit</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile 3-Dot Carousel Indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5 sm:hidden" aria-hidden="true">
        {posts.map((p, i) => (
          <span
            key={p.id}
            className={`h-1 rounded-full transition-all ${i === 0 ? "w-5 bg-brand" : "w-1.5 bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}
