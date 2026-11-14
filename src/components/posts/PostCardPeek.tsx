"use client";

import React, { useState } from "react";
import Link from "next/link";
import { compactSlotLabel } from "@/lib/today";
import { isPostFailed, statusLine } from "@/lib/posts/library";
import { failureList } from "@/lib/publishFailures";
import { StatusLabel } from "@/components/ui/Text";
import PostThumb from "./PostThumb";
import type { AssetItem } from "@/types";

interface PostCardPeekProps {
  post: AssetItem;
  timeZone: string;
  nextSlot: string | null;
  onSchedule?: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onRetry?: (postId: string, channel?: string) => Promise<void>;
  isScheduling?: boolean;
  isRetrying?: boolean;
  liveLink?: { url: string; label: string };
}

function channelSummary(post: AssetItem): string {
  const hasCarousel = Boolean(post.linkedin_went_as === "CAROUSEL" || post.carousel_pages?.length);
  const channels = post.channels?.length ? post.channels : ["LinkedIn"];
  const channelNames = channels.map((c) =>
    c.toLowerCase().includes("link") ? "LinkedIn" : c.toLowerCase().includes("insta") ? "Instagram" : c.toLowerCase().includes("face") ? "Facebook" : c
  );
  return `${channelNames.join(" + ")} · ${hasCarousel ? "Carousel" : "Single"}`;
}

/**
 * PostCardPeek: individual post tile with interactive desktop hover/focus quick peek.
 * Features smooth hover-lift, opening hook quote, Details action, Delete action, and compact Schedule button.
 */
export default function PostCardPeek({
  post,
  timeZone,
  nextSlot,
  onSchedule,
  onDelete,
  onRetry,
  isScheduling,
  isRetrying,
  liveLink,
}: PostCardPeekProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = statusLine(post, timeZone);
  const channelsText = channelSummary(post);
  const isUnapproved = post.status === "PENDING_REVIEW";
  const isFailed = isPostFailed(post);
  const failures = failureList(post.publish_failures);
  const primaryChannel = failures[0]?.channel ?? "linkedin";
  const primaryLabel = failures[0]?.label ?? "post";
  const slotText = nextSlot ? compactSlotLabel(nextSlot, timeZone) : "";
  const showHoverOverlay = isHovered && (isUnapproved || isFailed);

  return (
    <div
      className="group relative flex flex-col transition-all duration-300 ease-out hover:-translate-y-1.5 focus-within:-translate-y-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsHovered(false);
        }
      }}
    >
      <div className="relative overflow-hidden rounded-[18px]">
        <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="block">
          <PostThumb
            post={post}
            className="transition-transform duration-200 group-hover:scale-[1.015]"
          />
        </Link>

        {/* Desktop Quick-Peek Floating Overlay on Hover */}
        {showHoverOverlay && (
          <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col justify-between bg-white/98 dark:bg-canvas/98 p-4 backdrop-blur-md shadow-xl border border-line/50 transition-opacity duration-150 animate-in fade-in">
            <div className="space-y-2.5 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <StatusLabel tone={status.tone} className="text-[11px]">
                    {status.text}
                  </StatusLabel>
                  <span className="truncate text-[11px] font-medium text-muted">
                    · {channelsText}
                  </span>
                </div>

                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void onDelete(post.id);
                    }}
                    className="shrink-0 p-1 text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer"
                    title="Delete draft"
                    aria-label="Delete draft"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <h4 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink">
                {post.title}
              </h4>

              {isFailed && failures.length > 0 ? (
                <p className="border-l border-danger/40 pl-2.5 py-0.5 text-[12px] text-danger font-medium leading-relaxed line-clamp-3">
                  {failures.map((f) => `${f.label}: ${f.reason}`).join(" · ")}
                </p>
              ) : post.hook ? (
                <blockquote className="border-l border-brand/40 pl-2.5 py-0.5 text-[13px] text-ink/85 italic leading-relaxed line-clamp-3">
                  “{post.hook.replace(/^["']|["']$/g, "")}”
                </blockquote>
              ) : null}
            </div>

            {/* Exactly Two Buttons: High-attention Primary Action + Quiet Secondary Edit */}
            <div className="flex items-center gap-2 pt-2 border-t border-line/60">
              {isFailed && onRetry ? (
                <button
                  type="button"
                  onClick={() => void onRetry(post.id, primaryChannel)}
                  disabled={isRetrying}
                  className="group/btn flex-1 min-w-0 min-h-[38px] px-3 rounded-full bg-brand text-white text-[13px] font-medium shadow-sm hover:bg-brand/90 hover:shadow active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="truncate">{isRetrying ? "Retrying…" : `Retry · ${primaryLabel}`}</span>
                </button>
              ) : isUnapproved && nextSlot && onSchedule ? (
                <button
                  type="button"
                  onClick={() => void onSchedule(post.id)}
                  disabled={isScheduling}
                  className="group/btn flex-1 min-w-0 min-h-[38px] px-3 rounded-full bg-brand text-white text-[13px] font-medium shadow-sm hover:bg-brand/90 hover:shadow active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 shrink-0 opacity-90 transition-transform group-hover/btn:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{isScheduling ? "Scheduling..." : `Schedule · ${slotText}`}</span>
                </button>
              ) : null}

              <Link
                href={`/editorial?id=${encodeURIComponent(post.id)}`}
                className="group/edit shrink-0 min-h-[38px] px-3.5 rounded-full bg-surface border border-line hover:border-ink/20 text-ink text-[13px] font-medium hover:bg-line/40 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 transition-all flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-muted group-hover/edit:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Static Info Below Thumbnail */}
      <div className="mt-3 space-y-1 px-0.5">
        <div className="flex items-center justify-between gap-2">
          <StatusLabel tone={status.tone} className="text-[13px]">
            {status.text}
          </StatusLabel>
          <span className="truncate text-[12px] text-muted">{channelsText}</span>
        </div>

        <Link
          href={`/editorial?id=${encodeURIComponent(post.id)}`}
          className="block group-hover:text-brand"
        >
          <p className="line-clamp-2 text-[15px] font-medium leading-snug text-ink transition-colors">
            {post.title}
          </p>
        </Link>

        {/* Mobile Quick Action Strip */}
        {isFailed && onRetry ? (
          <div className="flex items-center gap-1.5 pt-2 sm:hidden">
            <button
              type="button"
              onClick={() => void onRetry(post.id, primaryChannel)}
              disabled={isRetrying}
              className="flex-1 min-w-0 min-h-[36px] px-2.5 rounded-full bg-brand text-white text-[12px] font-medium flex items-center justify-center truncate active:scale-[0.985] shadow-sm gap-1"
            >
              <span>{isRetrying ? "..." : `Retry · ${primaryLabel}`}</span>
            </button>
            <Link
              href={`/editorial?id=${encodeURIComponent(post.id)}`}
              className="shrink-0 min-h-[36px] px-3 rounded-full bg-surface border border-line text-ink text-[12px] font-medium flex items-center justify-center active:scale-[0.985]"
            >
              Edit
            </Link>
          </div>
        ) : isUnapproved && nextSlot && onSchedule ? (
          <div className="flex items-center gap-1.5 pt-2 sm:hidden">
            <button
              type="button"
              onClick={() => void onSchedule(post.id)}
              disabled={isScheduling}
              className="flex-1 min-w-0 min-h-[36px] px-2.5 rounded-full bg-brand text-white text-[12px] font-medium flex items-center justify-center truncate active:scale-[0.985] shadow-sm"
            >
              {isScheduling ? "..." : `Schedule · ${slotText}`}
            </button>
            <Link
              href={`/editorial?id=${encodeURIComponent(post.id)}`}
              className="shrink-0 min-h-[36px] px-3 rounded-full bg-surface border border-line text-ink text-[12px] font-medium flex items-center justify-center active:scale-[0.985]"
            >
              Edit
            </Link>
          </div>
        ) : null}

        {isFailed && onRetry && (
          <div className="hidden sm:block pt-1">
            <button
              type="button"
              onClick={() => void onRetry(post.id, primaryChannel)}
              disabled={isRetrying}
              className="cursor-pointer text-[12.5px] font-semibold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>↻</span>
              <span>{isRetrying ? "Retrying…" : `Retry ${primaryLabel}`}</span>
            </button>
          </div>
        )}

        {liveLink && (
          <a
            href={liveLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[13px] text-brand hover:underline"
          >
            View on {liveLink.label} ↗
          </a>
        )}
      </div>
    </div>
  );
}
