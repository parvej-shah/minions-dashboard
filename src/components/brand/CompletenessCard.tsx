"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Gauge } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import type { BrandCompleteness, BrandTab, CompletenessPrompt } from "@/types";

/**
 * How much Minions knows about the author, with the next three things to add.
 * Onboarding stays short on purpose; this is how the rest gets filled in.
 */
export default function CompletenessCard({ version, onGo }: { version: number; onGo: (tab: BrandTab) => void }) {
  const [data, setData] = useState<BrandCompleteness | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<BrandCompleteness>("/api/brand/completeness")
      .then((d) => !cancelled && setData(d))
      // Advisory only: a failed load hides the card rather than blocking the page.
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (failed && !data) return null;
  if (!data) {
    return (
      <SkeletonGroup label="Checking your profile" className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 md:flex-row md:items-center">
        <div className="space-y-2 md:w-56 shrink-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </SkeletonGroup>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="md:w-56 shrink-0 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <Gauge className="h-4 w-4 text-brand" />
            Profile {data.score}% complete
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={data.score} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${data.score}%` }} />
          </div>
          <p className="text-[11px] text-subtle">The more Minions knows, the less generic your ideas get.</p>
        </div>
        {data.prompts.length === 0 ? (
          <p className="text-sm text-muted">Everything is in place. Keep adding experience as you work.</p>
        ) : (
          <ul className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-3">
            {data.prompts.map((p: CompletenessPrompt) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onGo(p.tab)}
                  className="group flex h-full w-full items-start justify-between gap-2 rounded-lg border border-line bg-canvas px-3 py-2.5 text-left text-xs text-ink hover:border-brand/50 cursor-pointer"
                >
                  <span>{p.text}</span>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle group-hover:text-brand" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
