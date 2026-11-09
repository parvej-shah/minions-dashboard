"use client";

import React from "react";
import type { AssetItem } from "@/types";

export interface ClaimsGateProps {
  activeAsset: AssetItem;
  verifiedClaimsCount: number;
  totalClaims: number;
  allClaimsVerified: boolean;
  onToggleClaim: (claimId: string) => void;
}

/** The facts the post states, each checked against what the author told us. */
export default function ClaimsGate({ activeAsset, verifiedClaimsCount, totalClaims, allClaimsVerified, onToggleClaim }: ClaimsGateProps) {
  return (
    <section aria-label="Facts in this post" className="space-y-3">
      <p className="flex items-baseline justify-between gap-2 text-[15px] font-medium text-ink">
        Facts in this post
        <span className={`text-sm font-normal ${allClaimsVerified ? "text-success" : "text-gold"}`}>
          {allClaimsVerified ? `All ${totalClaims} checked` : `${verifiedClaimsCount} of ${totalClaims} checked`}
        </span>
      </p>
      <ul className="space-y-2">
        {activeAsset.claims.map((claim) => {
          const ok = claim.verified === "Y";
          return (
            <li key={claim.id} className="space-y-1.5 rounded-2xl bg-surface-2 p-3">
              <p className="text-sm leading-relaxed text-ink">&ldquo;{claim.claim_text}&rdquo;</p>
              <button
                type="button"
                onClick={() => onToggleClaim(claim.id)}
                aria-pressed={ok}
                title={ok ? "Mark as needing a look" : "Mark as checked"}
                className={`cursor-pointer text-sm font-medium hover:underline ${ok ? "text-success" : "text-gold"}`}
              >
                {ok ? "✓ Checked" : "Needs a look · mark checked"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
