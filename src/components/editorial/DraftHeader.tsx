"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe } from "lucide-react";
import type { AssetItem } from "@/types";

export interface DraftHeaderProps {
  activeAsset: AssetItem;
  /** The in-progress title, which may differ from the saved one. */
  title: string;
  currentAssetIndex: number;
  totalDrafts: number;
  isStandaloneRoute: boolean;
}

/** Breadcrumb, active draft title, and the live/pending status chip. */
export default function DraftHeader({
  activeAsset,
  title,
  currentAssetIndex,
  totalDrafts,
  isStandaloneRoute,
}: DraftHeaderProps) {
  return (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
    <div className="flex items-center gap-3.5 min-w-0">
      {isStandaloneRoute && (
        <Link
          href="/editorial"
          className="p-2.5 rounded-xl bg-surface border border-line text-muted hover:text-ink hover:bg-surface-2 hover:border-[#2A3D52] transition-all shrink-0"
          title="Return to Editorial Studio"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      )}

      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <span className="text-subtle tracking-wider uppercase font-semibold">Reviewing</span>
          <span className="hidden">/</span>
          <span className="text-brand font-bold">Draft {currentAssetIndex + 1} of {totalDrafts}</span>
          <span className="hidden">•</span>
          <span className="hidden px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/30">
            v{activeAsset.version}.0
          </span>
          <span className="hidden">•</span>
          <span className={`hidden px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
            activeAsset.audience === "ICP" 
              ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30"
              : activeAsset.audience === "PEER"
                ? "bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30"
                : "bg-gold/15 text-gold border border-gold/30"
          }`}>
            {activeAsset.audience} LANE
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink mt-1 break-words">
          {title}
        </h1>
      </div>
    </div>

    {/* Live Status Badge or Link */}
    <div className="flex items-center gap-2.5 shrink-0">
      {activeAsset.status === "PUBLISHED" ? (
        <a
          href={activeAsset.doc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Live on Blog</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>
      ) : (
        <span className="flex items-center gap-1.5 bg-gold/10 text-gold border border-gold/30 text-xs font-semibold px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          Ready for review
        </span>
      )}
    </div>
  </div>
  );
}
