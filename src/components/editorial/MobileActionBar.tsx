"use client";

import React from "react";
import { Check, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import type { PublishState } from "@/hooks/useEditorialDraft";
import type { AssetItem } from "@/types";

export interface MobileActionBarProps {
  activeAsset: AssetItem;
  title: string;
  currentAssetIndex: number;
  totalDrafts: number;
  wordCount: number;
  verifiedClaimsCount: number;
  totalClaims: number;
  allClaimsVerified: boolean;
  isDirty: boolean;
  isSaving: boolean;
  publishState: PublishState;
  onSave: () => void;
  onPublish: () => void;
}

/** Floating save/publish bar shown below the lg breakpoint. */
export default function MobileActionBar({
  activeAsset,
  title,
  currentAssetIndex,
  totalDrafts,
  wordCount,
  verifiedClaimsCount,
  totalClaims,
  allClaimsVerified,
  isDirty,
  isSaving,
  publishState,
  onSave,
  onPublish,
}: MobileActionBarProps) {
  return (
  <div className="lg:hidden fixed bottom-0 max-md:bottom-[calc(67px+max(0.65rem,env(safe-area-inset-bottom)))] left-0 right-0 z-35 bg-[#0F1419]/95 backdrop-blur-xl border-t border-[#1F2D3D] p-2.5 px-4 md:pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-2xl">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 text-[10px] font-mono">
        <span className="font-bold text-[#00C9A7]">Draft {currentAssetIndex + 1}/{totalDrafts}</span>
        <span className="text-[#64748B]">•</span>
        <span className="text-[#94A3B8]">{wordCount}w</span>
        <span className="text-[#64748B]">•</span>
        <span className={allClaimsVerified ? "text-[#00C9A7]" : "text-[#F59E0B]"}>
          {verifiedClaimsCount}/{totalClaims} Claims
        </span>
      </div>
      <div className="text-xs font-bold text-[#F1F5F9] truncate">
        {title}
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={onSave}
        disabled={isSaving}
        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
          isDirty
            ? "bg-[#00C9A7] text-[#070B0F] border-[#00C9A7]"
            : "bg-[#161D26] text-[#94A3B8] border-[#1F2D3D]"
        }`}
        title="Save Draft (⌘S)"
      >
        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>

      {activeAsset.status === "PUBLISHED" ? (
        <a
          href={activeAsset.doc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-[#00C9A7] text-[#070B0F] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm"
        >
          <span>Live</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <button
          onClick={onPublish}
          disabled={publishState === "pending"}
          className="px-3.5 py-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#00C9A7]/20 disabled:opacity-50 cursor-pointer"
        >
          {publishState === "pending" ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Publishing</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve</span>
            </>
          )}
        </button>
      )}
    </div>
  </div>
  );
}
