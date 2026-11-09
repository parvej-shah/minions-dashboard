"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { AssetItem } from "@/types";
import { formatDate } from "@/utils/date";
import { liveLinks } from "@/lib/drafts/liveLinks";

export interface DraftHeaderProps {
  activeAsset: AssetItem;
  /** The in-progress title, which may differ from the saved one. */
  title: string;
  currentAssetIndex: number;
  totalDrafts: number;
  isStandaloneRoute: boolean;
  blogEnabled: boolean;
}

/** One line of where this draft stands, its title, and a link to the live post once it went out. */
export default function DraftHeader({
  activeAsset,
  title,
  currentAssetIndex,
  totalDrafts,
  isStandaloneRoute,
  blogEnabled,
}: DraftHeaderProps) {
  const isPublished = activeAsset.status === "PUBLISHED";
  const live = isPublished ? liveLinks(activeAsset, blogEnabled)[0] : undefined;
  const postedOn = activeAsset.linkedin_published_at ?? activeAsset.published_at;
  const where =
    isPublished
      ? `Published${postedOn ? ` ${formatDate(postedOn)}` : ""}`
      : activeAsset.status === "SCHEDULED"
        ? "Scheduled"
        : activeAsset.status === "UNPUBLISHED"
          ? "Taken down"
          : totalDrafts > 1
            ? `Draft ${currentAssetIndex + 1} of ${totalDrafts} · ready for review`
            : "Ready for review";

  return (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-4">
    <div className="flex items-center gap-3.5 min-w-0">
      {isStandaloneRoute && (
        <Link
          href="/editorial"
          className="p-2.5 rounded-xl bg-surface border border-line text-muted hover:text-ink hover:bg-surface-2 hover:border-line-strong transition-all shrink-0"
          title="Return to Editorial Studio"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      )}

      <div className="min-w-0">
        <p className={`text-xs font-semibold ${isPublished ? "text-brand" : "text-muted"}`}>{where}</p>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink mt-1 break-words">
          {title}
        </h1>
      </div>
    </div>

    {live && (
      <a
        href={live.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-brand/30 bg-brand/10 px-3.5 py-2 text-xs font-semibold text-brand transition-all hover:bg-brand/20 md:self-auto"
      >
        <span>View on {live.label}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    )}
  </div>
  );
}
