"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, ChevronDown, RefreshCw } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { OBJECTIVES } from "@/lib/plan/fill";
import { formatForecastSlot } from "@/lib/schedule/executivePace";

interface WeekSlot {
  slot_at: string;
  lane_id: string | null;
  lane_name: string | null;
  lane_pinned: boolean;
  status: string;
  idea_id: string | null;
  idea_title: string | null;
  fill_method: string | null;
  gate_reasons: string[];
  asset_id: string | null;
  note: string | null;
  preview: boolean;
}

interface Plan {
  exists: boolean;
  filler_enabled: boolean;
  require_review: boolean;
  primary_objective: string;
  secondary_objective: string | null;
  plan_starts_on: string | null;
  plan_ends_on: string | null;
  slot_lanes: Record<string, string>;
  lanes: { id: string; name: string; purpose: string; weight: number; is_active: boolean }[];
  week: { timezone: string; filler_enabled: boolean; slots: WeekSlot[] };
}

const OBJECTIVE_LABEL: Record<string, string> = {
  AUTHORITY: "Authority: be the one who understands the problem",
  CREDIBILITY: "Credibility: show the real work behind it",
  DEMAND: "Demand: help the reader choose",
};

/**
 * Calm Executive Forecast:
 * Displays the coming week's scheduled publishing slots with real draft hooks
 * and plain-English statuses, free of algorithmic jargon.
 */
export default function ContentPlanCard({ onMessage }: { onMessage: (m: string) => void }) {
  const { data: plan, error, reload, setData: setPlan } = useApiResource<Plan | null>("/api/plan", null, {
    errorMessage: "Could not load the content plan",
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await reload();
    } finally {
      setRetrying(false);
    }
  };

  const save = async (what: string, body: Record<string, unknown>, done?: string) => {
    setSaving(what);
    try {
      setPlan(await apiClient.patch<Plan>("/api/plan", body));
      if (done) onMessage(done);
    } catch (e) {
      onMessage(toErrorMessage(e, "Could not save the plan"));
    } finally {
      setSaving(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5 text-xs text-ink shadow-sm flex items-center justify-between gap-3">
        <span className="text-muted">{error}</span>
        <button
          type="button"
          onClick={() => void retry()}
          disabled={retrying}
          aria-busy={retrying}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed"
        >
          {retrying && <RefreshCw className="h-3 w-3 animate-spin" />}
          {retrying ? "Trying again…" : "Try again"}
        </button>
      </div>
    );
  }

  if (!plan) {
    return <LoadingState label="Loading upcoming forecast…" rows={1} />;
  }

  if (!plan.exists) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-xs text-muted shadow-sm">
        Save your publishing pace above to generate your upcoming forecast.
      </div>
    );
  }

  const tz = plan.week.timezone;
  const selectClass =
    "rounded-lg bg-canvas border border-line px-2.5 py-1.5 text-xs text-ink transition-colors focus:outline-none focus:border-brand cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div aria-busy={saving !== null} className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <CalendarRange className="h-4 w-4 text-brand" />
            Upcoming publishing forecast
          </h2>
          <span className="text-xs text-muted">
            {plan.week.slots.length} scheduled slot{plan.week.slots.length === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {plan.filler_enabled
            ? "Minions drafts and stages posts ahead of each scheduled time."
            : "Preview of your pace. Turn on automatic drafting above to activate these slots."}
        </p>
        {saving && (
          <p role="status" aria-live="polite" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <RefreshCw className="h-3 w-3 animate-spin" /> Updating forecast…
          </p>
        )}
      </div>

      {/* FORECAST LIST */}
      {plan.week.slots.length === 0 ? (
        <div className="rounded-xl border border-line bg-canvas p-4 text-center text-xs text-muted">
          No slots in the next 7 days. Check the weekly rhythm above.
        </div>
      ) : (
        <div className="space-y-2.5">
          {plan.week.slots.map((slot) => {
            const formatted = formatForecastSlot(slot, tz);
            return (
              <div
                key={slot.slot_at}
                className={`flex flex-col gap-2 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  formatted.isReady
                    ? "border-brand/40 bg-brand/[0.02]"
                    : "border-line bg-canvas"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-ink">{formatted.timeFormatted}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        formatted.isReady
                          ? "bg-brand/15 text-brand font-bold"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {formatted.statusLabel}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-xs text-ink font-medium leading-snug">
                    {formatted.title}
                  </p>
                </div>

                {formatted.isReady && formatted.assetId && (
                  <Link
                    href={`/editorial?id=${formatted.assetId}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-ink transition-transform active:scale-[0.985] hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    Open draft <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QUIET FINE-TUNE ACCORDION FOR ADVANCED USERS */}
      <details className="group border-t border-line/60 pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-xs font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
          <span>Fine-tune content focus &amp; active dates (optional)</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <p className="mt-1 text-xs text-subtle">
          Align content with quarterly business goals · changes save automatically
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-muted">Primary objective</span>
            <select
              value={plan.primary_objective}
              disabled={saving !== null}
              onChange={(e) =>
                void save(
                  "objective",
                  {
                    primary_objective: e.target.value,
                    ...(plan.secondary_objective === e.target.value ? { secondary_objective: null } : {}),
                  },
                  "Primary objective saved"
                )
              }
              className={`${selectClass} w-full`}
            >
              {OBJECTIVES.map((o) => (
                <option key={o} value={o}>
                  {OBJECTIVE_LABEL[o]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-muted">Secondary objective</span>
            <select
              value={plan.secondary_objective ?? ""}
              disabled={saving !== null}
              onChange={(e) => void save("objective", { secondary_objective: e.target.value || null }, "Secondary objective saved")}
              className={`${selectClass} w-full`}
            >
              <option value="">None</option>
              {OBJECTIVES.filter((o) => o !== plan.primary_objective).map((o) => (
                <option key={o} value={o}>
                  {OBJECTIVE_LABEL[o]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-muted">Active from</span>
            <input
              type="date"
              value={plan.plan_starts_on ?? ""}
              disabled={saving !== null}
              onChange={(e) => void save("dates", { plan_starts_on: e.target.value || null }, "Plan dates saved")}
              className={`${selectClass} w-full`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-muted">Active until</span>
            <input
              type="date"
              value={plan.plan_ends_on ?? ""}
              min={plan.plan_starts_on ?? undefined}
              disabled={saving !== null}
              onChange={(e) => void save("dates", { plan_ends_on: e.target.value || null }, "Plan dates saved")}
              className={`${selectClass} w-full`}
            />
          </label>
        </div>
      </details>
    </div>
  );
}
