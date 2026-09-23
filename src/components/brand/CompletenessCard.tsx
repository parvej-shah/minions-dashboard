"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Gauge } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { BrandCompleteness, BrandTab, CompletenessPrompt } from "@/types";

/**
 * How much Minions knows about the author, with the next three things to add.
 * Onboarding stays short on purpose; this is how the rest gets filled in.
 */
export default function CompletenessCard({ version, onGo }: { version: number; onGo: (tab: BrandTab) => void }) {
  const [data, setData] = useState<BrandCompleteness | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<BrandCompleteness>("/api/brand/completeness")
      .then((d) => !cancelled && setData(d))
      // Advisory only: a failed load hides the card rather than blocking the page.
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-[#1F2D3D] bg-[#0F1419] p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="md:w-56 shrink-0 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F1F5F9]">
            <Gauge className="h-4 w-4 text-[#00C9A7]" />
            Profile {data.score}% complete
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1F2D3D]" role="progressbar" aria-valuenow={data.score} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[#00C9A7] transition-all" style={{ width: `${data.score}%` }} />
          </div>
          <p className="text-[11px] text-[#64748B]">The more Minions knows, the less generic your ideas get.</p>
        </div>
        {data.prompts.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Everything is in place. Keep adding experience as you work.</p>
        ) : (
          <ul className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-3">
            {data.prompts.map((p: CompletenessPrompt) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onGo(p.tab)}
                  className="group flex h-full w-full items-start justify-between gap-2 rounded-lg border border-[#1F2D3D] bg-[#070B0F] px-3 py-2.5 text-left text-xs text-[#F1F5F9] hover:border-[#00C9A7]/50 cursor-pointer"
                >
                  <span>{p.text}</span>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64748B] group-hover:text-[#00C9A7]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
