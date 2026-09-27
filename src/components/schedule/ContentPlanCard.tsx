"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarRange, Lightbulb, Pin, RefreshCw, Sparkles } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";
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
  LANE: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
  OTHER_LANE: "bg-[#3B82F6]/10 text-[#93C5FD] border-[#3B82F6]/30",
  TARGETED_HARVEST: "bg-[#A78BFA]/10 text-[#C4B5FD] border-[#A78BFA]/30",
  BELOW_BAR: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
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
 * one will draft and how that idea was chosen. While the slot filler is off,
 * the week is a preview: nothing is reserved, harvested or drafted.
 */
export default function ContentPlanCard({ onMessage }: { onMessage: (m: string) => void }) {
  const { data: plan, error, reload, setData: setPlan } = useApiResource<Plan | null>("/api/plan", null, {
    errorMessage: "Could not load the content plan",
  });
  const [saving, setSaving] = useState<string | null>(null);

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
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] text-xs text-[#F59E0B] flex items-center justify-between gap-3">
        <span>{error}</span>
        <button type="button" onClick={() => void reload()} className="text-[#00C9A7] hover:underline">
          Try again
        </button>
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] text-xs text-[#64748B] flex items-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading the content plan…
      </div>
    );
  }
  if (!plan.exists) {
    return (
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] text-xs text-[#94A3B8]">
        Save a schedule above first. The content plan fills its slots.
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
    "rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-2.5 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7] [color-scheme:dark] disabled:opacity-60";

  const pinFor = (s: WeekSlot) => slotKey(localParts(new Date(s.slot_at), tz).weekday, utcToZoned(new Date(s.slot_at), tz).time);
  const setPin = (s: WeekSlot, laneId: string) => {
    const next = { ...plan.slot_lanes };
    const key = pinFor(s);
    if (laneId) next[key] = laneId;
    else delete next[key];
    void save(`pin-${key}`, { slot_lanes: next }, laneId ? "Lane pinned to this weekly slot" : "Lane set back to automatic");
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#00C9A7]" />
            Content plan
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            {plan.filler_enabled
              ? "On: an idea is kept for each slot in the next 7 days and drafted at the slot's time. A lane with no strong idea gets a harvest of its own ahead of time."
              : "Off: nothing is drafted on its own. The week below shows what would be drafted if it were on."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={plan.filler_enabled}
          aria-label="Fill slots automatically"
          disabled={saving !== null}
          onClick={() =>
            void save("filler", { filler_enabled: !plan.filler_enabled }, plan.filler_enabled ? "Slot filling switched off" : "Slot filling switched on: the next 7 days are planned")
          }
          className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 disabled:opacity-60 ${plan.filler_enabled ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${plan.filler_enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-medium text-[#94A3B8] block mb-1">Main objective</span>
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
          <span className="text-[11px] font-medium text-[#94A3B8] block mb-1">Second objective (optional)</span>
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
          <span className="text-[11px] font-medium text-[#94A3B8] block mb-1">Starts (optional)</span>
          <input
            type="date"
            value={plan.plan_starts_on ?? ""}
            disabled={saving !== null}
            onChange={(e) => void save("dates", { plan_starts_on: e.target.value || null }, "Plan dates saved")}
            className={`${selectClass} w-full`}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-[#94A3B8] block mb-1">Ends (optional)</span>
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
      <p className="text-[11px] text-[#64748B] leading-relaxed -mt-2">
        The objectives lean the lane mix toward lanes with that purpose; each lane&apos;s weight is set on Brand › Audience &amp; Experience.
      </p>

      <div className="pt-4 border-t border-[#1F2D3D]/60 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider font-mono">The next 7 days</h3>
          {!plan.filler_enabled && <span className="text-[10px] font-mono text-[#64748B]">Preview</span>}
        </div>

        {plan.week.slots.length === 0 ? (
          <p className="text-xs text-[#64748B]">No slots in the next 7 days. Check the cadence above, the plan dates, or that the schedule is active.</p>
        ) : (
          <div className="space-y-4">
            {[...byDay.entries()].map(([day, slots]) => (
              <div key={day} className="space-y-2">
                <div className="text-[11px] font-semibold text-[#94A3B8]">
                  {new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric" }).format(new Date(slots[0].slot_at))}
                </div>
                {slots.map((s) => {
                  const line = statusLine(s);
                  const key = pinFor(s);
                  const editable = s.status === "PLANNED" || s.status === "HARVESTING" || s.status === "NEEDS_IDEAS";
                  return (
                    <div key={s.slot_at} className="rounded-xl border border-[#1F2D3D] bg-[#070B0F] p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#F1F5F9]">
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
                          {plan.slot_lanes[key] && <Pin className="w-3 h-3 text-[#00C9A7]" aria-label="Pinned lane" />}
                          <select
                            aria-label="Lane for this weekly slot"
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
                        <p className="text-[11px] text-[#F59E0B] flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          Below the usual bar: {s.gate_reasons.join("; ")}. Its draft always waits for your review.
                        </p>
                      )}
                      {line && <p className="text-[11px] text-[#64748B]">{line}</p>}
                      {s.status === "DRAFTED" && s.asset_id && (
                        <Link href={`/editorial?id=${s.asset_id}`} className="text-[11px] text-[#00C9A7] hover:underline">
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
        <p className="text-[11px] text-[#64748B] leading-relaxed">
          <Sparkles className="inline w-3 h-3 mr-1 text-[#00C9A7]" />
          Pinning a lane applies to that weekday and time every week. Times are {tz.split("/").pop()!.replace(/_/g, " ")} time.
        </p>
      </div>

      {needsNudge && (
        <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-xs text-[#FCD34D] flex items-start gap-2">
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Some slots have no strong idea yet. A recent piece of work, a lesson or a client question gives the harvester something only you could say.{" "}
            <Link href="/brand?tab=experience" className="text-[#00C9A7] hover:underline font-semibold">
              Add an update
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
