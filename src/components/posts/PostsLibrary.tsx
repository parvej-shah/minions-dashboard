"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApiResource } from "@/hooks/useApiResource";
import { useChannelSummary } from "@/hooks/useChannelSummary";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { countFor, defaultShow, postsFor, statusLine, type PostShow } from "@/lib/posts/library";
import { liveLinks } from "@/lib/drafts/liveLinks";
import { Segmented, SearchField } from "@/components/ui/Filters";
import { buttonStyles } from "@/components/ui/Button";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { cardClass } from "@/components/ui/Card";
import { PageHeader, StatusLabel } from "@/components/ui/Text";
import PostThumb from "./PostThumb";
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
        <PageHeader title="Posts">
          {show === "needs" && countFor(assets.data, "needs") > 0 ? "Nothing goes out until you approve it." : null}
        </PageHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Show"
            options={SHOWS.map((s) => ({ key: s.key, label: s.label, count: s.key === "needs" ? countFor(assets.data, s.key) : undefined }))}
            value={show}
            onChange={pick}
          />
          <SearchField label="Search posts" value={query} onChange={setQuery} />
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
          <button type="button" onClick={() => void assets.reload()} className={buttonStyles({ className: "mt-5" })}>Try again</button>
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
        <ul className="columns-2 gap-5 sm:columns-3 lg:columns-4">
          {list.map((post) => {
            const status = statusLine(post, tz);
            const live = post.status === "PUBLISHED" ? liveLinks(post, channels?.blog ?? true)[0] : undefined;
            return (
              <li key={post.id} className="mb-7 break-inside-avoid">
                <Link href={`/editorial?id=${encodeURIComponent(post.id)}`} className="group block">
                  <PostThumb post={post} className="transition-opacity group-hover:opacity-90" />
                  <StatusLabel tone={status.tone} className="mt-3 px-0.5 text-[13px]">{status.text}</StatusLabel>
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
