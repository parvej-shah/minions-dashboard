"use client";

import React from "react";
import { Check } from "lucide-react";
import { GroupedList } from "@/components/ui/List";
import type { AssetItem } from "@/types";

export interface ClaimsGateProps {
  activeAsset: AssetItem;
  verifiedClaimsCount: number;
  totalClaims: number;
  allClaimsVerified: boolean;
  onToggleClaim: (claimId: string) => void;
}

/**
 * The facts the post states, each checked against what the author told us:
 * one row per fact, a round check on the right that fills in once checked.
 */
export default function ClaimsGate({ activeAsset, verifiedClaimsCount, totalClaims, allClaimsVerified, onToggleClaim }: ClaimsGateProps) {
  return (
    <section aria-label="Facts in this post">
      <GroupedList
        header={
          <>
            <span>Facts in this post</span>
            <span className={allClaimsVerified ? "text-success" : "text-gold"}>
              {allClaimsVerified ? `All ${totalClaims} checked` : `${verifiedClaimsCount} of ${totalClaims} checked`}
            </span>
          </>
        }
        footer={allClaimsVerified ? undefined : "Tap a fact once you know it's true."}
      >
        {activeAsset.claims.map((claim) => {
          const ok = claim.verified === "Y";
          return (
            <button
              key={claim.id}
              type="button"
              onClick={() => onToggleClaim(claim.id)}
              aria-pressed={ok}
              title={ok ? "Mark as needing a look" : "Mark as checked"}
              className="flex min-h-11 w-full min-w-0 cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[15px] leading-snug text-ink">&ldquo;{claim.claim_text}&rdquo;</span>
                <span className={`mt-0.5 block text-[13px] ${ok ? "text-success" : "text-gold"}`}>{ok ? "Checked" : "Needs a look"}</span>
              </span>
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${ok ? "bg-success text-white" : "border-[1.5px] border-line-strong bg-surface"}`}
              >
                {ok && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </GroupedList>
    </section>
  );
}
