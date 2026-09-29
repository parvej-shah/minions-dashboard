"use client";

import { useState } from "react";
import { CalendarClock, ShieldCheck, ShieldOff, Save, RefreshCw, Sparkles, Clock3, ChevronDown } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import ContentPlanCard from "@/components/schedule/ContentPlanCard";
import AutomaticDrafting from "@/components/schedule/AutomaticDrafting";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { DEFAULT_TIMEZONE } from "@/constants/config";

type CadenceType = "DAILY" | "EVERY_N_DAYS" | "DAYS_OF_WEEK";

interface SchedulePayload {
  exists: boolean;
  timezone: string;
  cadence_type: CadenceType;
  interval_days: number | null;
  days_of_week: number[];
  posts_per_day: number;
  times_of_day: string[];
  require_review: boolean;
}

const EMPTY_PAYLOAD: SchedulePayload = {
  exists: false,
  timezone: DEFAULT_TIMEZONE,
  cadence_type: "EVERY_N_DAYS",
  interval_days: 3,
  days_of_week: [],
  posts_per_day: 1,
  times_of_day: ["09:00"],
  require_review: true,
};

const CADENCE_OPTIONS: { key: CadenceType; label: string }[] = [
  { key: "DAILY", label: "Every day" },
  { key: "EVERY_N_DAYS", label: "Every few days" },
  { key: "DAYS_OF_WEEK", label: "Choose days" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function rhythmSummary(data: SchedulePayload) {
  const times = data.times_of_day.map((time) => {
    const [hour, minute] = time.split(":").map(Number);
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
  });
  const timeText = times.join(" and ");
  if (data.cadence_type === "DAILY") return `Every day at ${timeText}`;
  if (data.cadence_type === "DAYS_OF_WEEK") {
    const days = data.days_of_week.map((day) => DAY_LABELS[day]).join(", ");
    return `${days || "Choose your days"} at ${timeText}`;
  }
  return `Every ${data.interval_days ?? 1} day${data.interval_days === 1 ? "" : "s"} at ${timeText}`;
}

export default function SchedulePage() {
  const { data, isLoading, setData } = useApiResource<SchedulePayload>("/api/schedule", EMPTY_PAYLOAD, {
    errorMessage: "Could not load posting schedule",
  });
  const toast = useToast(4000);
  const [saving, setSaving] = useState(false);
  // Remounts the content plan after a schedule save, so its week matches the new cadence.
  const [planKey, setPlanKey] = useState(0);
  // Remounts the drafting status after a schedule save, so its next slot is current.
  const [statusKey, setStatusKey] = useState(0);

  function updatePostsPerDay(next: number) {
    const clamped = Math.max(1, Math.min(4, next));
    setData((prev) => {
      const times = [...prev.times_of_day];
      while (times.length < clamped) times.push("09:00");
      while (times.length > clamped) times.pop();
      return { ...prev, posts_per_day: clamped, times_of_day: times };
    });
  }

  function updateTime(index: number, value: string) {
    setData((prev) => ({
      ...prev,
      times_of_day: prev.times_of_day.map((t, i) => (i === index ? value : t)),
    }));
  }

  function toggleDayOfWeek(day: number) {
    setData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.patch("/api/schedule", {
        cadence_type: data.cadence_type,
        interval_days: data.interval_days,
        days_of_week: data.days_of_week,
        posts_per_day: data.posts_per_day,
        times_of_day: data.times_of_day,
        require_review: data.require_review,
      });
      toast.show("Saved — your rhythm and upcoming plan are refreshed.");
      setPlanKey((k) => k + 1);
      setStatusKey((k) => k + 1);
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not save the posting schedule."));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <LoadingState label="Loading posting schedule…" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      <div className="pb-1">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-2">
          <CalendarClock className="w-3.5 h-3.5" />
          Posting Schedule
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">Build a rhythm that sticks</h1>
        <p className="text-sm text-[#94A3B8] mt-2 max-w-2xl leading-relaxed">
          Choose when Minions prepares your drafts. You stay in control of what gets published.
        </p>
      </div>

      <section aria-label="Your posting rhythm" className="relative overflow-hidden rounded-2xl border border-[#00C9A7]/30 bg-gradient-to-br from-[#00C9A7]/10 via-[#0F1419] to-[#0F1419] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00C9A7]/15 text-[#00C9A7]"><Sparkles className="h-5 w-5" /></div>
          <div className="min-w-0">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[#00C9A7]">Your rhythm</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#F1F5F9]">{rhythmSummary(data)}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#94A3B8]"><Clock3 className="h-3.5 w-3.5" /> Drafts are prepared at these times · {data.timezone}</p>
          </div>
        </div>
      </section>

      {/* THE ONE SWITCH */}
      <AutomaticDrafting key={statusKey} onChanged={() => setPlanKey((k) => k + 1)} onMessage={toast.show} />

      {/* CADENCE */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[#00C9A7]">Step 1</p>
          <h2 className="mt-1 text-base font-bold text-[#F1F5F9]">Pick your pace</h2>
          <p className="mt-1 text-xs text-[#94A3B8]">A steady, realistic rhythm beats trying to post every day.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CADENCE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setData((prev) => ({ ...prev, cadence_type: opt.key }))}
              aria-pressed={data.cadence_type === opt.key}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7] ${
                data.cadence_type === opt.key
                  ? "border-[#00C9A7] bg-[#00C9A7]/10 text-[#00C9A7]"
                  : "border-[#1F2D3D] text-[#94A3B8]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {data.cadence_type === "EVERY_N_DAYS" && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8]">Create a draft every</span>
            <input
              type="number"
              min={1}
              value={data.interval_days ?? 1}
              onChange={(e) => setData((prev) => ({ ...prev, interval_days: Math.max(1, Number(e.target.value) || 1) }))}
              className="w-20 rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            />
            <span className="text-xs text-[#94A3B8]">day(s)</span>
          </div>
        )}

        {data.cadence_type === "DAYS_OF_WEEK" && (
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDayOfWeek(i)}
                aria-pressed={data.days_of_week.includes(i)}
                className={`rounded-full border w-12 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7] ${
                  data.days_of_week.includes(i)
                    ? "border-[#00C9A7] bg-[#00C9A7]/10 text-[#00C9A7]"
                    : "border-[#1F2D3D] text-[#94A3B8]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <details open={data.posts_per_day > 1} className="group border-t border-[#1F2D3D]/60 pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 text-sm font-semibold text-[#CBD5E1] [&::-webkit-details-marker]:hidden">
            More timing options
            <ChevronDown className="h-4 w-4 text-[#64748B] transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8]">Drafts per active day</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updatePostsPerDay(data.posts_per_day - 1)}
                className="w-7 h-7 rounded-lg border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-bold text-[#F1F5F9]">{data.posts_per_day}</span>
              <button
                type="button"
                onClick={() => updatePostsPerDay(data.posts_per_day + 1)}
                className="w-7 h-7 rounded-lg border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {data.times_of_day.map((time, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#64748B] w-14">Post {i + 1}</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="flex-1 rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                />
              </div>
            ))}
          </div>
          </div>
        </details>
      </div>

      {/* REVIEW TOGGLE */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[#00C9A7]">Step 2</p>
          <div className="mt-1 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
            {data.require_review ? (
              <ShieldCheck className="w-4 h-4 text-[#00C9A7]" />
            ) : (
              <ShieldOff className="w-4 h-4 text-[#F59E0B]" />
            )}
            {data.require_review ? "You review every draft" : "Publish eligible drafts automatically"}
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={!data.require_review}
            aria-label="Publish eligible drafts automatically"
            onClick={() => setData((prev) => ({ ...prev, require_review: !prev.require_review }))}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              !data.require_review ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                !data.require_review ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          </div>
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          {data.require_review
            ? "Every scheduled draft waits in Editorial Studio. Nothing publishes until you approve it."
            : "Eligible scheduled drafts publish automatically when ready. Drafts that fail checks, fall below the usual bar, or that you start yourself still wait for review."}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#1F2D3D] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[#00C9A7]">Step 3</p>
          <p className="mt-1 text-xs text-[#94A3B8]">Your changes shape upcoming draft slots.</p>
          {data.cadence_type === "DAYS_OF_WEEK" && data.days_of_week.length === 0 && <p className="mt-1 text-xs text-[#F59E0B]">Choose at least one day to save this rhythm.</p>}
        </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || (data.cadence_type === "DAYS_OF_WEEK" && data.days_of_week.length === 0)}
        className="inline-flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-sm font-bold px-5 py-3 rounded-xl transition-all disabled:opacity-60"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save my rhythm"}
      </button>
      </div>

      {/* THE OUTCOME */}
      <ContentPlanCard key={planKey} onMessage={toast.show} />

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161D26] border border-[#1F2D3D] text-[#F1F5F9] px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
