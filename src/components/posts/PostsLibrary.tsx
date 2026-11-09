"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApiResource } from "@/hooks/useApiResource";
import { useChannelSummary } from "@/hooks/useChannelSummary";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { countFor, defaultShow, postsFor, statusLine, type PostShow, type Tone } from "@/lib/posts/library";
import { liveLinks } from "@/lib/drafts/liveLinks";
import { segment } from "@/components/ui/segment";
import { buttonStyles } from "@/components/ui/Button";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import PostThumb from "./PostThumb";
import type { AssetItem } from "@/types";

const SHOWS: { key: PostShow; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs", label: "Needs you" },
  { key: "scheduled", label: "Scheduled" },
  { key: "posted", label: "Posted" },
];

const TONE: Record<Tone, string> = {
  coral: "text-coral",
  success: "text-success",
  muted: "text-muted",
  brand: "text-brand",
};

const EMPTY: Record<PostShow, string> = {
  all: "No posts yet. Minions writes your first one from your ideas.",
  needs: "Nothing needs you right now.",
  scheduled: "Nothing is scheduled.",
  posted: "Nothing has gone out yet.",
};

/** The Posts library: a calm, image-first grid of every post. */
export default function PostsLibrary({ initialShow }: { initialShow: PostShow | null }) {
  const assets = useApiResource<AssetItem[]>("/api/assets", [], { errorMessage: "Could not load your posts" });
  const schedule = useApiResource<{ timezone?: string } | null>("/api/schedule", null);
  const channels = useChannelSummary();
  const [chosen, setChosen] = useState<PostShow | null>(initialShow);
  const [query, setQuery] = useState("");

  const tz = schedule.data?.timezone || DEFAULT_TIMEZONE;
  const show = chosen ?? defaultShow(assets.data);
  const q = query.trim().toLowerCase();
  const list = postsFor(assets.data, show).filter((p) => !q || p.title.toLowerCase().includes(q));

  const pick = (key: PostShow) => {
    setChosen(key);
    const url = new URL(window.location.href);
    url.searchParams.set("show", key);
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-2">
          <h1 className="text-[40px] font-bold leading-[1.08] tracking-[-0.035em] text-ink sm:text-5xl">Posts</h1>
          {show === "needs" && countFor(assets.data, "needs") > 0 && (
            <p className="text-[17px] text-muted">Nothing goes out until you approve it.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Show" className={segment.track}>
            {SHOWS.map((s) => {
              const n = countFor(assets.data, s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={show === s.key}
                  onClick={() => pick(s.key)}
                  className={`min-h-9 cursor-pointer px-4 text-[15px] ${show === s.key ? segment.on : segment.off}`}
                >
                  {s.label}
                  {s.key === "needs" && n > 0 ? ` · ${n}` : ""}
                </button>
              );
            })}
          </div>
          <label className="flex min-h-11 flex-[0_1_220px] items-center gap-2 rounded-full bg-surface-3 px-4">
            <span className="sr-only">Search posts</span>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-muted">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
          </label>
        </div>
      </div>

      {assets.isLoading ? (
        <SkeletonGroup label="Loading posts" className="columns-2 gap-5 sm:columns-3 lg:columns-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className={`mb-6 w-full rounded-2xl ${i % 3 === 0 ? "aspect-square" : "aspect-[4/5]"}`} />
          ))}
        </SkeletonGroup>
      ) : assets.error ? (
        <div className="rounded-[28px] bg-surface p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.04)]">
          <p className="text-[17px] text-ink">{assets.error}</p>
          <button type="button" onClick={() => void assets.reload()} className={buttonStyles({ className: "mt-5" })}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[28px] bg-surface-2 px-6 py-16 text-center">
          <p className="text-[17px] text-muted">{q ? `No posts match “${query}”.` : EMPTY[show]}</p>
          {!q && show !== "all" && (
            <button type="button" onClick={() => pick("all")} className="mt-3 cursor-pointer text-[17px] text-brand hover:underline">
              See all posts
            </button>
          )}
        </div>
      ) : (
        <ul className="columns-2 gap-5 sm:columns-3 lg:columns-4">
          {list.map((post) => {
            const status = statusLine(post, tz);
            const live = post.status === "PUBLISHED" ? liveLinks(post, channels?.blog ?? true)[0] : undefined;
            return (
              <li key={post.id} className="mb-7 break-inside-avoid">
                <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="group block">
                  <PostThumb post={post} className="transition-opacity group-hover:opacity-90" />
                  <p className={`mt-3 px-0.5 text-[13px] font-semibold ${TONE[status.tone]}`}>● {status.text}</p>
                  <p className="mt-0.5 line-clamp-2 px-0.5 text-[15px] font-medium leading-snug text-ink">{post.title}</p>
                </Link>
                {live && (
                  <a href={live.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block px-0.5 text-[13px] text-brand hover:underline">
                    View on {live.label} ↗
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
