"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Plus, RefreshCw, Save, X } from "lucide-react";
import { LoadingState } from "@/components/ui/EmptyState";
import ContentPlanCard from "@/components/schedule/ContentPlanCard";
import AutomaticDrafting from "@/components/schedule/AutomaticDrafting";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { segment } from "@/components/ui/segment";

import { buttonStyles } from "@/components/ui/Button";
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
  { key: "DAYS_OF_WEEK", label: "Set days" },
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ADDED_TIMES = ["09:00", "13:00", "16:00", "19:00"];
const MAX_TIMES = 4;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function signature(data: SchedulePayload) {
  return JSON.stringify({
    cadence_type: data.cadence_type,
    interval_days: data.cadence_type === "EVERY_N_DAYS" ? data.interval_days : null,
    days_of_week: data.cadence_type === "DAYS_OF_WEEK" ? data.days_of_week : [],
    posts_per_day: data.posts_per_day,
    times_of_day: data.times_of_day,
    require_review: data.require_review,
  });
}

/** The drafting schedule: the automatic-drafting switch, a one-card cadence editor and the week plan. Opened from Editorial Studio. */
export default function ScheduleSettings() {
  const [data, setData] = useState<SchedulePayload>(EMPTY_PAYLOAD);
  const [savedData, setSavedData] = useState<SchedulePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [planKey, setPlanKey] = useState(0);
  const [statusKey, setStatusKey] = useState(0);
  const toast = useToast(4000);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiClient.get<SchedulePayload>("/api/schedule");
      setData(next);
      setSavedData(next);
      setLoadError(null);
    } catch (error) {
      setLoadError(toErrorMessage(error, "Could not load your schedule."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const updateData = (update: (previous: SchedulePayload) => SchedulePayload) => {
    setData(update);
    setSaveError(null);
  };

  function addTime() {
    updateData((previous) => {
      const times = previous.times_of_day;
      if (times.length >= MAX_TIMES) return previous;
      const afterLast = ADDED_TIMES.find((time) => time > times[times.length - 1] && !times.includes(time));
      const next = [...times, afterLast ?? ADDED_TIMES.find((time) => !times.includes(time)) ?? "09:00"];
      return { ...previous, posts_per_day: next.length, times_of_day: next };
    });
  }

  function removeTime(index: number) {
    updateData((previous) => {
      const next = previous.times_of_day.filter((_, i) => i !== index);
      return { ...previous, posts_per_day: next.length, times_of_day: next };
    });
  }

  function toggleDayOfWeek(day: number) {
    updateData((previous) => ({
      ...previous,
      days_of_week: previous.days_of_week.includes(day)
        ? previous.days_of_week.filter((selected) => selected !== day)
        : [...previous.days_of_week, day].sort(),
    }));
  }

  const hasUnsavedChanges = !data.exists || savedData === null || signature(data) !== signature(savedData);
  const missingDay = data.cadence_type === "DAYS_OF_WEEK" && data.days_of_week.length === 0;
  const missingTime = data.times_of_day.some((time) => !TIME_RE.test(time));
  const duplicateTime = new Set(data.times_of_day).size !== data.times_of_day.length;
  const invalidInterval = data.cadence_type === "EVERY_N_DAYS" && (!Number.isInteger(data.interval_days) || (data.interval_days ?? 0) < 1);
  const canSave = !missingDay && !missingTime && !duplicateTime && !invalidInterval;
  const problem = missingDay ? "Choose at least one day." : missingTime ? "Choose a time for every draft." : duplicateTime ? "Give each draft its own time." : invalidInterval ? "Choose a valid gap between drafts." : null;

  async function saveSchedule() {
    const saved = await apiClient.patch<SchedulePayload>("/api/schedule", {
      cadence_type: data.cadence_type,
      interval_days: data.interval_days,
      days_of_week: data.days_of_week,
      posts_per_day: data.posts_per_day,
      times_of_day: data.times_of_day,
      require_review: data.require_review,
    });
    const next = { ...data, ...saved };
    setData(next);
    setSavedData(next);
    setPlanKey((key) => key + 1);
  }

  async function handleSave() {
    if (saving || !canSave || !hasUnsavedChanges) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveSchedule();
      toast.show("Schedule saved. Your upcoming week has been refreshed.");
      setStatusKey((key) => key + 1);
    } catch (error) {
      setSaveError(toErrorMessage(error, "Could not save your schedule. Try again."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndEnable(): Promise<boolean> {
    if (saving || !canSave) return false;
    setSaving(true);
    setSaveError(null);
    try {
      if (hasUnsavedChanges) await saveSchedule();
      await apiClient.patch("/api/plan", { filler_enabled: true });
      toast.show("Schedule saved. Automatic drafting is on.");
      setPlanKey((key) => key + 1);
      return true;
    } catch (error) {
      setSaveError(toErrorMessage(error, "Could not save the schedule and turn on automatic drafting."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-10"><LoadingState label="Loading your schedule…" /></div>;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6 text-ink">
        <AlertCircle className="h-6 w-6 text-gold" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold">We couldn&apos;t load your schedule</h1>
        <p className="mt-1 text-sm text-muted">{loadError} Your saved settings have not changed.</p>
        <button type="button" onClick={() => void load()} className={buttonStyles({ className: "mt-5" })}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  const chip = "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";
  const field = "rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-4">
      <AutomaticDrafting
        key={`status-${statusKey}`}
        blockedByUnsavedChanges={hasUnsavedChanges || saving}
        canSaveSchedule={canSave}
        onChanged={() => setPlanKey((key) => key + 1)}
        onEnableWithSave={handleSaveAndEnable}
        onMessage={toast.show}
      />

      <section aria-label="Drafting schedule" className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-20 shrink-0 text-xs font-semibold text-muted">Draft</span>
          <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-canvas p-1" role="group" aria-label="Drafting cadence">
            {CADENCE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                disabled={saving}
                aria-pressed={data.cadence_type === option.key}
                onClick={() => updateData((previous) => ({ ...previous, cadence_type: option.key }))}
                className={`${chip} ${data.cadence_type === option.key ? segment.on : segment.off}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {data.cadence_type === "EVERY_N_DAYS" && (
            <label className="flex items-center gap-2 text-sm text-ink">
              every
              <input
                type="number"
                min={1}
                aria-label="Days between drafts"
                disabled={saving}
                value={data.interval_days ?? 1}
                onChange={(event) => updateData((previous) => ({ ...previous, interval_days: Math.max(1, Number(event.target.value) || 1) }))}
                className={`${field} w-16`}
              />
              days
            </label>
          )}
        </div>

        {data.cadence_type === "DAYS_OF_WEEK" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="w-20 shrink-0 text-xs font-semibold text-muted">On</span>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Drafting weekdays">
              {DAY_LABELS.map((label, day) => {
                const selected = data.days_of_week.includes(day);
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={saving}
                    aria-label={new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date(2023, 0, day + 1))}
                    aria-pressed={selected}
                    onClick={() => toggleDayOfWeek(day)}
                    className={`${chip} min-w-11 border ${selected ? "border-brand bg-brand/15 font-bold text-brand" : "border-line text-muted hover:border-brand/60"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-20 shrink-0 text-xs font-semibold text-muted">At</span>
          {data.times_of_day.map((time, index) => (
            <span key={index} className="inline-flex items-center gap-0.5">
              <input
                type="time"
                value={time}
                disabled={saving}
                aria-label={data.times_of_day.length === 1 ? "Draft time" : `Draft ${index + 1} time`}
                onChange={(event) => updateData((previous) => ({ ...previous, times_of_day: previous.times_of_day.map((entry, i) => i === index ? event.target.value : entry) }))}
                className={field}
              />
              {data.times_of_day.length > 1 && (
                <button type="button" disabled={saving} aria-label={`Remove draft ${index + 1}`} onClick={() => removeTime(index)} className="cursor-pointer rounded-md p-1 text-subtle transition-colors hover:text-ink disabled:cursor-not-allowed">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
          {data.times_of_day.length < MAX_TIMES && (
            <button type="button" disabled={saving} onClick={addTime} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add time
            </button>
          )}
          <span className="text-xs text-subtle">{data.timezone}</span>
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Publish without my review</p>
            <p className="mt-0.5 text-xs text-muted">
              {data.require_review ? "Off: nothing goes live until you approve it." : "On: scheduled drafts that pass checks go live; others wait for you."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!data.require_review}
            aria-label="Publish without my review"
            disabled={saving}
            onClick={() => updateData((previous) => ({ ...previous, require_review: !previous.require_review }))}
            className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-60 ${!data.require_review ? "bg-gold" : "bg-line"}`}
          >
            <span className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${!data.require_review ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {saveError && <p role="alert" className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold">{saveError}</p>}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {problem ? <span className="text-xs text-gold">{problem}</span> : hasUnsavedChanges && <span className="text-xs text-muted">Not saved yet</span>}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !canSave || !hasUnsavedChanges}
            aria-busy={saving}
            className={buttonStyles()}
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : hasUnsavedChanges ? <Save className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            {saving ? "Saving…" : hasUnsavedChanges ? "Save schedule" : "Saved"}
          </button>
        </div>
      </section>

      <ContentPlanCard key={`plan-${planKey}`} onMessage={toast.show} />

      {toast.message && <div role="status" className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink shadow-soft">{toast.message}</div>}
    </div>
  );
}
