"use client";

import React from "react";
import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import type { AssetItem } from "@/types";

export interface ClaimsGateProps {
  activeAsset: AssetItem;
  verifiedClaimsCount: number;
  totalClaims: number;
  allClaimsVerified: boolean;
  onToggleClaim: (claimId: string) => void;
}

/**
 * The per-claim verification checklist.
 *
 * This read `activeAsset.claim_checks`, a field the API has never returned, so
 * the gate was permanently empty against real data. It reads `claims` now.
 */
export default function ClaimsGate({
  activeAsset,
  verifiedClaimsCount,
  totalClaims,
  allClaimsVerified,
  onToggleClaim,
}: ClaimsGateProps) {
  return (
        <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00C9A7]" />
              <span className="text-xs font-bold text-[#F1F5F9] font-mono uppercase tracking-wider">
                Claims Gate
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              allClaimsVerified
                ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40"
                : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40"
            }`}>
              {verifiedClaimsCount}/{totalClaims} PASSED
            </span>
          </div>

          {/* What the draft check found (phase 4): read these before the claims. */}
          {activeAsset.review_notes.length > 0 && (
            <div className="p-2.5 rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-[#F59E0B]">
                <AlertTriangle className="w-3 h-3" />
                Draft check
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#CBD5E1] leading-relaxed">
                {activeAsset.review_notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Scrollable Claims Checklist */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {activeAsset.claims.length > 0 ? (
              activeAsset.claims.map((claim) => {
                const isVerified = claim.verified === "Y";
                return (
                  <div
                    key={claim.id}
                    className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                      isVerified
                        ? "bg-[#070B0F] border-[#00C9A7]/30 hover:border-[#00C9A7]/60"
                        : "bg-[#070B0F] border-[#F59E0B]/40 hover:border-[#F59E0B]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded font-mono ${
                          claim.source === "GO_BENCHMARK"
                            ? "bg-[#00C9A7]/15 text-[#00C9A7]"
                            : claim.source === "OPERATOR_DISPATCH_DATA"
                              ? "bg-[#3B82F6]/15 text-[#3B82F6]"
                              : "bg-[#ff6b4a]/15 text-[#ff6b4a]"
                        }`}
                      >
                        {claim.source === "GO_BENCHMARK"
                          ? "Benchmark"
                          : claim.source === "OPERATOR_DISPATCH_DATA"
                            ? "Field Metric"
                            : "Voice Telemetry"}
                      </span>

                      <button
                        onClick={() => onToggleClaim(claim.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          isVerified
                            ? "bg-[#00C9A7]/20 text-[#00C9A7]"
                            : "bg-[#F59E0B]/20 text-[#F59E0B]"
                        }`}
                      >
                        {isVerified ? <Check className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                        <span>{isVerified ? "Verified" : "Flagged"}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-[#F1F5F9] font-medium leading-snug">
                      &quot;{claim.claim_text}&quot;
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-[#64748B] font-mono">
                No claims checks attached to this draft.
              </div>
            )}
          </div>
        </div>
  );
}
