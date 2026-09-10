"use client";

import React from "react";
import Image from "next/image";
import { AlertTriangle, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { AssetItem } from "@/types";

export interface CoverImageCardProps {
  activeAsset: AssetItem;
}

/** The 16:9 studio cover art panel. */
export default function CoverImageCard({ activeAsset }: CoverImageCardProps) {
  const coverNeedsAttention = activeAsset.hero_status !== "READY";
  const coverMessage = activeAsset.hero_status === "BLOCKED_BY_SAFETY"
    ? "Qwen’s safety filter blocked this cover. The draft is ready for review."
    : "The cover could not be generated. The draft is ready for review.";

  return (
<div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 sm:p-5 space-y-3 shadow-xl">
  <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
    <div className="flex items-center gap-2">
      <ImageIcon className="w-4 h-4 text-[#00C9A7]" />
      <span className="text-xs font-bold text-[#F1F5F9] font-mono uppercase tracking-wider">
        16:9 Studio Cover Image
      </span>
    </div>
    <span className="text-[10px] font-mono text-[#64748B]">{coverNeedsAttention ? "Cover needs attention" : "AI Generated · 1280×720"}</span>
  </div>

  {/* 16:9 Aspect Ratio Frame */}
  <div className="relative rounded-xl overflow-hidden border border-[#1F2D3D] aspect-[16/9] w-full bg-[#070B0F] group shadow-inner">
    {activeAsset.hero_image_url ? (
      <Image
        src={activeAsset.hero_image_url}
        alt={activeAsset.title}
        fill
        unoptimized
        sizes="(max-width: 1024px) 100vw, 780px"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    ) : (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
        <AlertTriangle className="w-9 h-9 text-[#F59E0B]" />
        <span className="text-sm font-semibold text-[#F1F5F9]">Cover needs attention</span>
        <span className="max-w-sm text-xs leading-relaxed text-[#94A3B8]">{coverMessage}</span>
        {activeAsset.hero_error_code && (
          <span className="text-[10px] font-mono text-[#64748B]">{activeAsset.hero_error_code}</span>
        )}
      </div>
    )}

    {/* Badges Overlay */}
    <div className="absolute top-3 right-3 flex items-center gap-2">
      <span className="bg-[#070B0F]/80 backdrop-blur-md text-[#00C9A7] border border-[#00C9A7]/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
        16:9 · 1280×720
      </span>
    </div>
  </div>

  {/* Cover Image Bottom Info Bar */}
  {activeAsset.hero_image_url && (
    <div className="flex items-center justify-between gap-3 bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-3.5 py-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-[#00C9A7] shrink-0"></span>
        <span className="text-xs font-semibold text-[#F1F5F9] truncate">
          16:9 Commercial Studio Cover Art Staged
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={activeAsset.hero_image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#00C9A7] border border-[#00C9A7]/30 hover:border-[#00C9A7] transition-all flex items-center gap-1.5 cursor-pointer"
          title="Open full resolution cover image"
        >
          <span>View Full Size</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )}
</div>
  );
}
