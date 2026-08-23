"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ShieldCheck, ShieldOff, Save, RefreshCw } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";

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
  is_active: boolean;
}

const EMPTY_PAYLOAD: SchedulePayload = {
  exists: false,
  timezone: "America/New_York",
  cadence_type: "EVERY_N_DAYS",
  interval_days: 3,
  days_of_week: [],
  posts_per_day: 1,
  times_of_day: ["09:00"],
  require_review: true,
  is_active: true,
};

const CADENCE_OPTIONS: { key: CadenceType; label: string }[] = [
  { key: "DAILY", label: "Every day" },
  { key: "EVERY_N_DAYS", label: "Every N days" },
  { key: "DAYS_OF_WEEK", label: "Specific days" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatSlot(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SchedulePage() {
  const { data, isLoading, setData } = useApiResource<SchedulePayload>("/api/schedule", EMPTY_PAYLOAD, {
    errorMessage: "Could not load posting schedule",
  });
  const toast = useToast(4000);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  async function loadSlots() {
    setSlotsLoading(true);
    try {
      const res = await apiClient.get<{ slots: string[] }>("/api/schedule/preview?count=8");
      setSlots(res.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    if (isLoading) return;
    // Deferred so the effect body performs no synchronous setState, matching
    // useApiResource's own reload pattern.
    const timer = setTimeout(loadSlots, 0);
    return () => clearTimeout(timer);
  }, [isLoading]);

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
        is_active: data.is_active,
      });
      toast.show("Posting schedule saved.");
      await loadSlots();
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
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      <div className="border-b border-[#1F2D3D] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
          <CalendarClock className="w-3.5 h-3.5" />
          Posting Schedule
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">When you post</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Set a real cadence. When it&apos;s time to post, an already-queued idea drafts first; if the
          queue is empty, the next available idea drafts instead; if there are no ideas at all,
          fresh ones are harvested first. Times are in your account timezone ({data.timezone}).
        </p>
      </div>

      {/* CADENCE */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#F1F5F9]">Cadence</h2>

        <div className="flex flex-wrap gap-2">
          {CADENCE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setData((prev) => ({ ...prev, cadence_type: opt.key }))}
              className={`rounded-full border px-4 py-2 text-sm ${
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
            <span className="text-xs text-[#94A3B8]">Post every</span>
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
                className={`rounded-full border w-12 py-2 text-xs font-mono ${
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

        <div className="pt-4 border-t border-[#1F2D3D]/60 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8]">Posts per active day</span>
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
      </div>

      {/* REVIEW TOGGLE */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
            {data.require_review ? (
              <ShieldCheck className="w-4 h-4 text-[#00C9A7]" />
            ) : (
              <ShieldOff className="w-4 h-4 text-[#F59E0B]" />
            )}
            Require review before publishing
          </h2>
          <button
            type="button"
            onClick={() => setData((prev) => ({ ...prev, require_review: !prev.require_review }))}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              data.require_review ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                data.require_review ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          {data.require_review
            ? "On: even a draft that passes the automated fact-check waits for your Approve & Publish click in Editorial Studio."
            : "Off: drafts that pass the automated fact-check publish immediately, with no manual click."}{" "}
          Drafts that fail the fact-check always wait for review, regardless of this setting.
        </p>
      </div>

      {/* PAUSE */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-[#F1F5F9]">Schedule active</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Pause the cadence without losing your configuration.</p>
        </div>
        <button
          type="button"
          onClick={() => setData((prev) => ({ ...prev, is_active: !prev.is_active }))}
          className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
            data.is_active ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
              data.is_active ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-sm font-bold px-5 py-3 rounded-xl transition-all disabled:opacity-60"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save schedule"}
      </button>

      {/* UPCOMING SLOTS */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-[#F1F5F9]">Upcoming posting slots</h3>
        {slotsLoading ? (
          <p className="text-xs text-[#64748B]">Computing…</p>
        ) : !slots || slots.length === 0 ? (
          <p className="text-xs text-[#64748B]">
            {data.is_active ? "Save a schedule to see upcoming slots." : "Schedule is paused."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {slots.map((iso) => (
              <li key={iso} className="text-xs font-mono text-[#94A3B8]">
                {formatSlot(iso, data.timezone)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161D26] border border-[#1F2D3D] text-[#F1F5F9] px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
