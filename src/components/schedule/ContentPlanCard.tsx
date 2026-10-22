"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarRange, ChevronDown, Lightbulb, Pin, RefreshCw, Sparkles } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { localParts } from "@/lib/pulse/week";
import { formatPostTime, utcToZoned } from "@/lib/postTime";
import { FILL_METHOD_LABEL, OBJECTIVES, slotKey, type FillMethod } from "@/lib/plan/fill";

interface WeekSlot {
  slot_at: string;
  lane_id: string | null;
  lane_name: string | null;
  lane_pinned: boolean;
  status: string;
  idea_id: string | null;
  idea_title: string | null;
  fill_method: FillMethod | null;
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

const METHOD_STYLE: Record<FillMethod, string> = {
  LANE: "bg-brand/10 text-brand border-brand/30",
  OTHER_LANE: "bg-[#3B82F6]/10 text-[#93C5FD] border-[#3B82F6]/30",
  TARGETED_HARVEST: "bg-[#A78BFA]/10 text-[#C4B5FD] border-[#A78BFA]/30",
  BELOW_BAR: "bg-gold/10 text-gold border-gold/30",
};

function statusLine(s: WeekSlot): string | null {
  switch (s.status) {
    case "DRAFTING":
      return "Drafting now";
    case "DRAFTED":
      return "Drafted: open it in Editorial";
    case "HARVESTING":
      return "Looking for ideas for this lane";
    case "EMPTY":
      return s.note ?? "Nothing was drafted";
    case "NEEDS_IDEAS":
      return "No strong idea in this lane yet";
    default:
      return s.idea_id ? null : s.note ?? "No strong idea yet";
  }
}

/**
 * The content plan (phase 7): what the plan is for, when it runs, which lane
 * each weekly slot serves, and the coming week slot by slot with the idea each
 * one will draft and how that idea was chosen. While automatic drafting is off
 * (its switch is AutomaticDrafting, above this plan),
 * the week is a preview: nothing is reserved, harvested or drafted.
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
      <div className="p-6 rounded-2xl bg-surface border border-line text-xs text-gold flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => void retry()}
          disabled={retrying}
          aria-busy={retrying}
          className="inline-flex shrink-0 items-center gap-1.5 text-brand transition-colors cursor-pointer hover:text-[#5EEAD4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {retrying && <RefreshCw className="h-3 w-3 animate-spin" />}
          {retrying ? "Trying again…" : "Try again"}
        </button>
      </div>
    );
  }
  if (!plan) {
    return <LoadingState label="Loading the content plan" rows={1} />;
  }
  if (!plan.exists) {
    return (
      <div className="p-6 rounded-2xl bg-surface border border-line text-xs text-muted">
        Save your rhythm to build your first week plan.
      </div>
    );
  }

  const tz = plan.week.timezone;
  const activeLanes = plan.lanes.filter((l) => l.is_active);
  const needsNudge = plan.week.slots.some((s) => s.fill_method === "BELOW_BAR" || ["HARVESTING", "EMPTY", "NEEDS_IDEAS"].includes(s.status) || (!s.idea_id && s.status === "PLANNED"));
  const byDay = new Map<string, WeekSlot[]>();
  for (const s of plan.week.slots) {
    const day = utcToZoned(new Date(s.slot_at), tz).date;
    byDay.set(day, [...(byDay.get(day) ?? []), s]);
  }
  const selectClass =
    "rounded-lg bg-canvas border border-line px-2.5 py-1.5 text-xs text-ink transition-colors focus:outline-none focus:border-brand [color-scheme:dark] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

  const pinFor = (s: WeekSlot) => slotKey(localParts(new Date(s.slot_at), tz).weekday, utcToZoned(new Date(s.slot_at), tz).time);
  const setPin = (s: WeekSlot, laneId: string) => {
    const next = { ...plan.slot_lanes };
    const key = pinFor(s);
    if (laneId) next[key] = laneId;
    else delete next[key];
    void save(`pin-${key}`, { slot_lanes: next }, laneId ? "Lane pinned to this weekly slot" : "Lane set back to automatic");
  };

  return (
    <div aria-busy={saving !== null} className="p-4 sm:p-5 rounded-2xl bg-surface border border-line space-y-3 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-brand" />
          Your next 7 days
        </h2>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          {plan.filler_enabled
            ? "Minions prepares a draft at each scheduled time."
            : "This is a preview. Turn on automatic drafting to use this schedule."}
        </p>
        {saving && (
          <p role="status" aria-live="polite" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <RefreshCw className="h-3 w-3 animate-spin" /> Saving plan changes…
          </p>
        )}
      </div>

      <details className="group border-t border-line/60 pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-semibold text-[#CBD5E1] transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
          <span>Preview upcoming drafts <span className="ml-1 text-xs font-normal text-muted">({plan.week.slots.length})</span></span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-muted">Minions picks a lane automatically. Open a slot only if you want to pin a different one.</p>

        {plan.week.slots.length === 0 ? (
          <p className="text-xs text-subtle">No slots in the next 7 days. Check the cadence above and the plan dates.</p>
        ) : (
          <div className="space-y-4">
            {[...byDay.entries()].map(([day, slots]) => (
              <div key={day} className="space-y-2">
                <div className="text-[11px] font-semibold text-muted">
                  {new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric" }).format(new Date(slots[0].slot_at))}
                </div>
                {slots.map((s) => {
                  const line = statusLine(s);
                  const key = pinFor(s);
                  const editable = s.status === "PLANNED" || s.status === "HARVESTING" || s.status === "NEEDS_IDEAS";
                  return (
                    <div key={s.slot_at} className="rounded-xl border border-line bg-canvas p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-ink">
                          {formatPostTime(s.slot_at, tz).split(", ").slice(-1)[0]}
                        </span>
                        {s.fill_method && (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${METHOD_STYLE[s.fill_method]}`}
                            title={s.gate_reasons.length ? s.gate_reasons.join("; ") : undefined}
                          >
                            {FILL_METHOD_LABEL[s.fill_method]}
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-1.5">
                          {plan.slot_lanes[key] && <Pin className="w-3 h-3 text-brand" aria-label="Pinned lane" />}
                          <select
                            aria-label={`Lane for ${formatPostTime(s.slot_at, tz)}`}
                            value={plan.slot_lanes[key] ?? ""}
                            disabled={saving !== null || !editable}
                            onChange={(e) => setPin(s, e.target.value)}
                            className={selectClass}
                          >
                            <option value="">{s.lane_name && !plan.slot_lanes[key] ? `Auto · ${s.lane_name}` : "Auto"}</option>
                            {activeLanes.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                      {s.idea_title ? (
                        <p className="text-xs text-[#CBD5E1] leading-snug line-clamp-2">{s.idea_title}</p>
                      ) : null}
                      {s.fill_method === "BELOW_BAR" && s.gate_reasons.length > 0 && (
                        <p className="text-[11px] text-gold flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          Below the usual bar: {s.gate_reasons.join("; ")}. Its draft always waits for your review.
                        </p>
                      )}
                      {line && <p className="text-[11px] text-subtle">{line}</p>}
                      {s.status === "DRAFTED" && s.asset_id && (
                        <Link href={`/editorial?id=${s.asset_id}`} className="text-[11px] text-brand transition-colors cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                          Open the draft
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-subtle leading-relaxed">
          <Sparkles className="inline w-3 h-3 mr-1 text-brand" />
          Pinning a lane applies to that weekday and time every week. Times are {tz.split("/").pop()!.replace(/_/g, " ")} time.
        </p>

      {needsNudge && (
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-[#FCD34D] flex items-start gap-2">
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Some slots have no strong idea yet. A recent piece of work, a lesson or a client question gives the harvester something only you could say.{" "}
            <Link href="/brand?tab=experience" className="text-brand transition-colors cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand font-semibold">
              Add an update
            </Link>
          </span>
        </div>
      )}
        </div>
      </details>

      <details className="group border-t border-line pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-semibold text-[#CBD5E1] transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
          Fine-tune your content plan
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <p className="mt-1 text-xs text-muted">Optional objectives and active dates · changes save automatically</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-medium text-muted block mb-1">Main objective</span>
            <select
              value={plan.primary_objective}
              disabled={saving !== null}
              onChange={(e) =>
                void save("objective", {
                  primary_objective: e.target.value,
                  ...(plan.secondary_objective === e.target.value ? { secondary_objective: null } : {}),
                }, "Objective saved")
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
            <span className="text-[11px] font-medium text-muted block mb-1">Second objective (optional)</span>
            <select
              value={plan.secondary_objective ?? ""}
              disabled={saving !== null}
              onChange={(e) => void save("objective", { secondary_objective: e.target.value || null }, "Objective saved")}
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
            <span className="text-[11px] font-medium text-muted block mb-1">Starts (optional)</span>
            <input
              type="date"
              value={plan.plan_starts_on ?? ""}
              disabled={saving !== null}
              onChange={(e) => void save("dates", { plan_starts_on: e.target.value || null }, "Plan dates saved")}
              className={`${selectClass} w-full`}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-muted block mb-1">Ends (optional)</span>
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
        <p className="mt-3 text-xs leading-relaxed text-muted">Set lane weights on Brand › Audience &amp; Experience.</p>
      </details>
    </div>
  );
}
