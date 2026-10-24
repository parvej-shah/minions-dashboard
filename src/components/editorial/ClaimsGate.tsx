"use client";

import React from "react";
import { AlertTriangle, Check, ChevronDown, ShieldCheck } from "lucide-react";
import type { AssetItem } from "@/types";

export interface ClaimsGateProps {
  activeAsset: AssetItem;
  verifiedClaimsCount: number;
  totalClaims: number;
  allClaimsVerified: boolean;
  onToggleClaim: (claimId: string) => void;
}

/**
 * The facts the draft states, each checked against what the author told us.
 * All checked, it folds to one line; anything unchecked opens it.
 */
export default function ClaimsGate({
  activeAsset,
  verifiedClaimsCount,
  totalClaims,
  allClaimsVerified,
  onToggleClaim,
}: ClaimsGateProps) {
  return (
    <details
      key={activeAsset.id}
      open={!allClaimsVerified}
      className="group rounded-2xl border border-line bg-surface p-4 sm:p-5"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-sm font-extrabold text-ink">
          <ShieldCheck className={`h-4 w-4 ${allClaimsVerified ? "text-brand" : "text-gold"}`} />
          Facts in this post
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={allClaimsVerified ? "text-brand" : "text-gold"}>
            {allClaimsVerified ? `All ${totalClaims} checked` : `${verifiedClaimsCount} of ${totalClaims} checked`}
          </span>
          <ChevronDown className="h-4 w-4 text-subtle transition-transform group-open:rotate-180" />
        </span>
      </summary>

      <ul className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {activeAsset.claims.map((claim) => {
          const isVerified = claim.verified === "Y";
          return (
            <li
              key={claim.id}
              className={`space-y-2 rounded-xl border bg-canvas p-3 ${isVerified ? "border-line" : "border-gold/40"}`}
            >
              <p className="text-xs font-medium leading-relaxed text-ink">&ldquo;{claim.claim_text}&rdquo;</p>
              <button
                type="button"
                onClick={() => onToggleClaim(claim.id)}
                title={isVerified ? "Mark as needing a look" : "Mark as checked"}
                className={`flex min-h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors ${
                  isVerified ? "bg-brand/15 text-brand hover:bg-brand/25" : "bg-gold/15 text-gold hover:bg-gold/25"
                }`}
              >
                {isVerified ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                <span>{isVerified ? "Checked" : "Needs a look · mark checked"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
