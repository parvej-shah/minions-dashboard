"use client";

import React from "react";
import { Check, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import type { AssetItem } from "@/types";

import { buttonStyles } from "@/components/ui/Button";
export interface MobileActionBarProps {
  activeAsset: AssetItem;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReviewPublish: () => void;
  /** Where the published post can be read, or null. */
  liveUrl: string | null;
}

/** Floating save/publish bar shown below the lg breakpoint. */
export default function MobileActionBar({
  activeAsset,
  isDirty,
  isSaving,
  onSave,
  onReviewPublish,
  liveUrl,
}: MobileActionBarProps) {
  return (
  <div className="lg:hidden fixed max-md:bottom-[calc(67px+max(0.65rem,env(safe-area-inset-bottom)))] md:bottom-0 left-0 right-0 z-35 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur-xl shadow-2xl">
    <div className="mx-auto flex max-w-lg items-center gap-2">
      <button
        onClick={onSave}
        disabled={isSaving}
        aria-busy={isSaving || undefined}
        aria-label={isSaving ? "Saving draft" : "Save draft"}
        className={buttonStyles({ variant: isDirty ? "soft" : "secondary", size: "md", className: "min-w-0 flex-1" })}
        title="Save Draft (⌘S)"
      >
        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        <span>Save</span>
      </button>

      {activeAsset.status === "PUBLISHED" ? (
        liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ size: "md", className: "min-w-0 flex-1" })}
          >
            <span>View post</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )
      ) : (
        <button
          onClick={onReviewPublish}
          aria-label="Go to publishing options"
          className={buttonStyles({ size: "md", className: "min-w-0 flex-1" })}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Publish options</span>
        </button>
      )}
    </div>
  </div>
  );
}
