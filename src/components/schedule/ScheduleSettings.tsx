"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { autopilotAllowed, type LinkedInHealth } from "@/lib/linkedinHealth";
import { AlertCircle, Check, Clock, Plus, RefreshCw, Save, ShieldCheck, Zap, X } from "lucide-react";
import { LoadingState } from "@/components/ui/EmptyState";
import ContentPlanCard from "@/components/schedule/ContentPlanCard";
import AutomaticDrafting from "@/components/schedule/AutomaticDrafting";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { buttonStyles } from "@/components/ui/Button";
import {
  RHYTHM_PRESETS,
  determineRhythmPreset,
  applyRhythmPreset,
  TIME_PRESETS,
  type RhythmPresetKey,
} from "@/lib/schedule/executivePace";

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
  linkedin?: LinkedInHealth;
}

const EMPTY_PAYLOAD: SchedulePayload = {
  exists: false,
  timezone: DEFAULT_TIMEZONE,
  cadence_type: "DAYS_OF_WEEK",
  interval_days: null,
  days_of_week: [1, 3, 5],
  posts_per_day: 1,
  times_of_day: ["09:00"],
  require_review: true,
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ADDED_TIMES = ["09:00", "12:30", "16:00", "18:00"];
const MAX_TIMES = 4;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function signature(data: SchedulePayload) {
  return JSON.stringify({
    cadence_type: data.cadence_type,
    interval_days: data.interval_days,
    days_of_week: [...data.days_of_week].sort(),
    posts_per_day: data.posts_per_day,
    times_of_day: data.times_of_day,
    require_review: data.require_review,
  });
}

/**
 * Executive Publishing Pace settings:
 * 3 calibrated rhythm presets, quick time pills, affirmative publishing control,
 * and an executive forecast of the coming week.
 */
export default function ScheduleSettings() {
  const [data, setData] = useState<SchedulePayload>(EMPTY_PAYLOAD);
  // Turning Autopilot on needs LinkedIn; an Autopilot already on can still be turned off (task 109).
  const autopilotBlocked = data.require_review && !!data.linkedin && !autopilotAllowed(data.linkedin);
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
      const normalized: SchedulePayload = {
        ...next,
        days_of_week:
          next.days_of_week.length > 0
            ? next.days_of_week
            : next.cadence_type === "DAILY"
            ? [1, 2, 3, 4, 5]
            : [1, 3, 5],
      };
      setData(normalized);
      setSavedData(normalized);
      setLoadError(null);
    } catch (error) {
      setLoadError(toErrorMessage(error, "Could not load your publishing pace."));
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

  const currentPreset = determineRhythmPreset(data.cadence_type, data.days_of_week);

  function handleSelectPreset(presetKey: RhythmPresetKey) {
    if (presetKey === "CUSTOM") {
      updateData((prev) => ({
        ...prev,
        cadence_type: "DAYS_OF_WEEK",
        days_of_week: prev.days_of_week.length > 0 ? prev.days_of_week : [1, 3, 5],
      }));
    } else {
      const next = applyRhythmPreset(presetKey);
      updateData((prev) => ({
        ...prev,
        cadence_type: next.cadence_type,
        days_of_week: next.days_of_week,
      }));
    }
  }

  function toggleDayOfWeek(day: number) {
    updateData((previous) => {
      const exists = previous.days_of_week.includes(day);
      const nextDays = exists
        ? previous.days_of_week.filter((d) => d !== day)
        : [...previous.days_of_week, day].sort();
      return {
        ...previous,
        cadence_type: "DAYS_OF_WEEK",
        days_of_week: nextDays,
      };
    });
  }

  function handleQuickTimeSelect(time: string) {
    updateData((previous) => {
      const currentTimes = [...previous.times_of_day];
      currentTimes[0] = time;
      return { ...previous, times_of_day: currentTimes };
    });
  }

  function addTime() {
    updateData((previous) => {
      const times = previous.times_of_day;
      if (times.length >= MAX_TIMES) return previous;
      const afterLast = ADDED_TIMES.find((time) => time > times[times.length - 1] && !times.includes(time));
      const next = [...times, afterLast ?? ADDED_TIMES.find((time) => !times.includes(time)) ?? "12:30"];
      return { ...previous, posts_per_day: next.length, times_of_day: next };
    });
  }

  function removeTime(index: number) {
    updateData((previous) => {
      const next = previous.times_of_day.filter((_, i) => i !== index);
      return { ...previous, posts_per_day: next.length, times_of_day: next };
    });
  }

  const hasUnsavedChanges = !data.exists || savedData === null || signature(data) !== signature(savedData);
  const missingDay = data.cadence_type === "DAYS_OF_WEEK" && data.days_of_week.length === 0;
  const missingTime = data.times_of_day.some((time) => !TIME_RE.test(time));
  const duplicateTime = new Set(data.times_of_day).size !== data.times_of_day.length;
  const canSave = !missingDay && !missingTime && !duplicateTime;
  const problem = missingDay
    ? "Choose at least one publishing day."
    : missingTime
    ? "Set a valid time for each draft."
    : duplicateTime
    ? "Each draft time must be distinct."
    : null;

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
      toast.show("Publishing pace saved. Your upcoming week has been updated.");
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
      toast.show("Publishing pace saved and automatic drafting is active.");
      setPlanKey((key) => key + 1);
      return true;
    } catch (error) {
      setSaveError(toErrorMessage(error, "Could not save the schedule and activate drafting."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-10"><LoadingState label="Loading your publishing pace…" /></div>;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-ink shadow-sm">
        <AlertCircle className="h-6 w-6 text-brand" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold">Could not load publishing pace</h2>
        <p className="mt-1 text-sm text-muted">{loadError}</p>
        <button type="button" onClick={() => void load()} className={buttonStyles({ className: "mt-4" })}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AutomaticDrafting
        key={`status-${statusKey}`}
        blockedByUnsavedChanges={hasUnsavedChanges || saving}
        canSaveSchedule={canSave}
        onEnableWithSave={handleSaveAndEnable}
      />

      <section aria-label="Publishing pace and cadence" className="space-y-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        {/* SECTION 1: WEEKLY RHYTHM PRESETS */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">1. Weekly rhythm</h2>
            <span className="text-xs text-muted">How often Minions posts</span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Weekly rhythm presets">
            {(Object.keys(RHYTHM_PRESETS) as RhythmPresetKey[]).map((key) => {
              const preset = RHYTHM_PRESETS[key];
              const isSelected = currentPreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={saving}
                  onClick={() => handleSelectPreset(key)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-brand bg-brand/[0.04] shadow-sm"
                      : "border-line bg-canvas hover:border-brand/40 hover:bg-surface-2"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-sm font-bold ${isSelected ? "text-brand" : "text-ink"}`}>
                        {preset.label}
                      </span>
                      {preset.badge && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted leading-snug">{preset.subtitle}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className={`h-3 w-3 rounded-full border transition-colors flex items-center justify-center ${
                        isSelected ? "border-brand bg-brand" : "border-line bg-surface"
                      }`}
                    >
                      {isSelected && <span className="h-1 w-1 rounded-full bg-white" />}
                    </span>
                    <span className="text-[11px] font-medium text-subtle">
                      {isSelected ? "Selected" : "Select"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CUSTOM DAYS SELECTOR (SHOWN WHEN CUSTOM OR ALWAYS ACCESSIBLE) */}
          {currentPreset === "CUSTOM" && (
            <div className="mt-4 rounded-xl border border-line bg-canvas p-3.5 space-y-2">
              <span className="text-xs font-semibold text-muted block">Select active publishing days</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Publishing weekdays">
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
                      className={`min-w-11 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed ${
                        selected
                          ? "border-brand bg-brand text-brand-ink shadow-sm"
                          : "border-line bg-surface text-muted hover:border-brand/40 hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: CALIBRATED POSTING TIME */}
        <div className="border-t border-line/60 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand" />
              2. Posting time
            </h2>
            <span className="text-xs text-subtle">Times shown in {data.timezone}</span>
          </div>

          <div className="mt-3 space-y-3">
            {/* QUICK PRESET TIME PILLS */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">Quick slot:</span>
              {TIME_PRESETS.map((preset) => {
                const isSelected = data.times_of_day[0] === preset.time;
                return (
                  <button
                    key={preset.time}
                    type="button"
                    disabled={saving}
                    onClick={() => handleQuickTimeSelect(preset.time)}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-brand bg-brand/10 font-bold text-brand"
                        : "border-line bg-canvas text-muted hover:border-brand/40 hover:text-ink"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* TIME INPUTS */}
            <div className="flex flex-wrap items-center gap-2.5">
              {data.times_of_day.map((time, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-2.5 py-1">
                  <input
                    type="time"
                    value={time}
                    disabled={saving}
                    aria-label={data.times_of_day.length === 1 ? "Draft time" : `Draft ${index + 1} time`}
                    onChange={(event) =>
                      updateData((previous) => ({
                        ...previous,
                        times_of_day: previous.times_of_day.map((entry, i) => (i === index ? event.target.value : entry)),
                      }))
                    }
                    className="bg-transparent text-sm font-semibold text-ink focus:outline-none"
                  />
                  {data.times_of_day.length > 1 && (
                    <button
                      type="button"
                      disabled={saving}
                      aria-label={`Remove draft time ${index + 1}`}
                      onClick={() => removeTime(index)}
                      className="cursor-pointer rounded p-0.5 text-subtle transition-colors hover:text-ink disabled:cursor-not-allowed"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </span>
              ))}

              {data.times_of_day.length < MAX_TIMES && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={addTime}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-line px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add time slot
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: AFFIRMATIVE PUBLISHING CONTROL (REVIEW FIRST VS AUTOPILOT) */}
        <div className="border-t border-line/60 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">3. Publishing control</h2>
            <span className="text-xs text-muted">How drafts get posted</span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Publishing control modes">
            {/* OPTION 1: REVIEW FIRST (RECOMMENDED) */}
            <button
              type="button"
              role="radio"
              aria-checked={data.require_review}
              disabled={saving}
              onClick={() => updateData((prev) => ({ ...prev, require_review: true }))}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed ${
                data.require_review
                  ? "border-brand bg-brand/[0.04] shadow-sm"
                  : "border-line bg-canvas hover:border-brand/40 hover:bg-surface-2"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    Review first
                  </span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                    Recommended
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Drafts wait in Today for your 1-tap approval before going live. Gives you complete oversight without delaying publication.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={`h-3 w-3 rounded-full border transition-colors flex items-center justify-center ${
                    data.require_review ? "border-brand bg-brand" : "border-line bg-surface"
                  }`}
                >
                  {data.require_review && <span className="h-1 w-1 rounded-full bg-white" />}
                </span>
                <span className="text-[11px] font-medium text-subtle">
                  {data.require_review ? "Active mode" : "Select Review first"}
                </span>
              </div>
            </button>

            {/* OPTION 2: AUTOPILOT */}
            <button
              type="button"
              role="radio"
              aria-checked={!data.require_review}
              disabled={saving || autopilotBlocked}
              onClick={() => updateData((prev) => ({ ...prev, require_review: false }))}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed ${
                !data.require_review
                  ? "border-brand bg-brand/[0.04] shadow-sm"
                  : "border-line bg-canvas hover:border-brand/40 hover:bg-surface-2"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <Zap className="h-4 w-4 text-brand" />
                    Autopilot
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                    Full autonomy
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Drafts that pass all quality and brand checks publish automatically at your scheduled time. Minions alerts you only if personal input is needed.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={`h-3 w-3 rounded-full border transition-colors flex items-center justify-center ${
                    !data.require_review ? "border-brand bg-brand" : "border-line bg-surface"
                  }`}
                >
                  {!data.require_review && <span className="h-1 w-1 rounded-full bg-white" />}
                </span>
                <span className="text-[11px] font-medium text-subtle">
                  {!data.require_review ? "Active mode" : autopilotBlocked ? "Connect LinkedIn first" : "Select Autopilot"}
                </span>
              </div>
            </button>
          </div>
          {autopilotBlocked && (
            <p className="mt-3 text-xs text-muted">
              Autopilot posts for you, so it needs a working LinkedIn connection.{" "}
              <Link href="/fleet" className="font-semibold text-brand hover:underline">
                {data.linkedin === "expired" ? "Reconnect LinkedIn" : "Connect LinkedIn"}
              </Link>
            </p>
          )}
        </div>

        {/* SAVE ACTION BAR */}
        {saveError && (
          <p role="alert" className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-ink">
            {saveError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
          <div className="text-xs">
            {problem ? (
              <span className="font-medium text-ink">{problem}</span>
            ) : hasUnsavedChanges ? (
              <span className="text-muted">Unsaved rhythm changes</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-brand">
                <Check className="h-3.5 w-3.5" /> Pace is active and up to date
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !canSave || !hasUnsavedChanges}
            aria-busy={saving}
            className={buttonStyles({
              className: "min-h-11 px-5 text-sm font-semibold transition-transform active:scale-[0.985]",
            })}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : hasUnsavedChanges ? (
              <Save className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {saving ? "Saving…" : hasUnsavedChanges ? "Save publishing pace" : "Saved"}
          </button>
        </div>
      </section>

      {/* SECTION 4: CALM EXECUTIVE FORECAST */}
      <ContentPlanCard key={`plan-${planKey}`} onMessage={toast.show} />

      {toast.message && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink shadow-soft"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
