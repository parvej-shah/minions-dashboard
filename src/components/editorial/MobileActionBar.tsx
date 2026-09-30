"use client";

import React from "react";
import { Check, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import type { PublishState } from "@/hooks/useEditorialDraft";
import type { AssetItem } from "@/types";

import { buttonStyles } from "@/components/ui/Button";
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
  <div className="lg:hidden fixed bottom-0 max-md:bottom-[calc(67px+max(0.65rem,env(safe-area-inset-bottom)))] left-0 right-0 z-35 bg-surface/95 backdrop-blur-xl border-t border-line p-2.5 px-4 md:pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-2xl">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 text-[10px] font-mono">
        <span className="font-bold text-brand">Draft {currentAssetIndex + 1}/{totalDrafts}</span>
        <span className="text-subtle">•</span>
        <span className="text-muted">{wordCount}w</span>
        <span className="text-subtle">•</span>
        <span className={allClaimsVerified ? "text-brand" : "text-gold"}>
          {verifiedClaimsCount}/{totalClaims} Claims
        </span>
      </div>
      <div className="text-xs font-bold text-ink truncate">
        {title}
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={onSave}
        disabled={isSaving}
        aria-label={isSaving ? "Saving draft" : "Save draft"}
        className={buttonStyles({ variant: isDirty ? "primary" : "secondary", size: "sm", className: "min-h-11 min-w-11 px-3" })}
        title="Save Draft (⌘S)"
      >
        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        <span>Save</span>
      </button>

      {activeAsset.status === "PUBLISHED" ? (
        <a
          href={activeAsset.doc_url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles({ size: "sm", className: "shrink-0" })}
        >
          <span>Live</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <button
          onClick={onPublish}
          disabled={publishState === "pending"}
          className={buttonStyles({ size: "sm", className: "shrink-0" })}
        >
          {publishState === "pending" ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Publishing</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activeAsset.status === "SCHEDULED" ? "Publish now" : "Approve"}</span>
            </>
          )}
        </button>
      )}
    </div>
  </div>
  );
}
