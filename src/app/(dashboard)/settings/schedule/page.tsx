"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, Check, ChevronDown, Clock3, RefreshCw, Save, Send, ShieldCheck } from "lucide-react";
import { LoadingState } from "@/components/ui/EmptyState";
import ContentPlanCard from "@/components/schedule/ContentPlanCard";
import AutomaticDrafting from "@/components/schedule/AutomaticDrafting";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { DEFAULT_TIMEZONE } from "@/constants/config";

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

const CADENCE_OPTIONS: { key: CadenceType; label: string; hint: string }[] = [
  { key: "DAILY", label: "Every day", hint: "A daily draft" },
  { key: "EVERY_N_DAYS", label: "Every few days", hint: "Choose the gap" },
  { key: "DAYS_OF_WEEK", label: "Choose days", hint: "Keep a weekly pattern" },
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ADDED_TIMES = ["09:00", "13:00", "16:00", "19:00"];
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

function rhythmSummary(data: SchedulePayload) {
  const times = data.times_of_day.map((time) => {
    if (!TIME_RE.test(time)) return "choose a time";
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
  const [data, setData] = useState<SchedulePayload>(EMPTY_PAYLOAD);
  const [savedData, setSavedData] = useState<SchedulePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [planKey, setPlanKey] = useState(0);
  const [statusKey, setStatusKey] = useState(0);
  const toast = useToast(4000);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiClient.get<SchedulePayload>("/api/schedule");
      setData(next);
      setSavedData(next);
      setAdvancedOpen(next.posts_per_day > 1);
      setScheduleOpen(!next.exists);
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

  function updatePostsPerDay(next: number) {
    const clamped = Math.max(1, Math.min(4, next));
    updateData((previous) => {
      const times = [...previous.times_of_day];
      while (times.length < clamped) {
        const afterLast = ADDED_TIMES.find((time) => time > times[times.length - 1] && !times.includes(time));
        times.push(afterLast ?? ADDED_TIMES.find((time) => !times.includes(time)) ?? "09:00");
      }
      while (times.length > clamped) times.pop();
      return { ...previous, posts_per_day: clamped, times_of_day: times };
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

  async function handleSave() {
    if (saving || !canSave || !hasUnsavedChanges) return;
    setSaving(true);
    setSaveError(null);
    try {
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
      toast.show("Schedule saved. Your upcoming week has been refreshed.");
      setPlanKey((key) => key + 1);
      setStatusKey((key) => key + 1);
    } catch (error) {
      setSaveError(toErrorMessage(error, "Could not save your rhythm. Try again."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndEnable(): Promise<boolean> {
    if (saving || !canSave) return false;
    setSaving(true);
    setSaveError(null);
    try {
      if (hasUnsavedChanges) {
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
      await apiClient.patch("/api/plan", { filler_enabled: true });
      toast.show("Schedule saved. Automatic drafting is on.");
      setPlanKey((key) => key + 1);
      setScheduleOpen(false);
      return true;
    } catch (error) {
      setSaveError(toErrorMessage(error, "Could not save the schedule and turn on automatic drafting."));
      setScheduleOpen(true);
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl py-10"><LoadingState label="Loading your rhythm…" /></div>;

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-gold/40 bg-gold/5 p-6 text-ink">
        <AlertCircle className="h-6 w-6 text-gold" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold">We couldn&apos;t load your rhythm</h1>
        <p className="mt-1 text-sm text-muted">{loadError} Your saved settings have not changed.</p>
        <button type="button" onClick={() => void load()} className={buttonStyles({ className: "mt-5" })}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <header className="pb-1">
        <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-brand">
          <CalendarClock className="h-4 w-4" aria-hidden="true" /> Draft schedule
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Your drafting schedule</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Set your pace once. Minions follows it until you want to make a change.
        </p>
      </header>

      <AutomaticDrafting
        key={statusKey}
        scheduleSummary={savedData?.exists
          ? `${rhythmSummary(savedData)} · ${savedData.timezone} · ${savedData.require_review ? "You review each draft" : "Eligible drafts publish automatically"}`
          : "Set a schedule before turning this on."}
        blockedByUnsavedChanges={hasUnsavedChanges || saving}
        canSaveSchedule={canSave}
        onChanged={() => setPlanKey((key) => key + 1)}
        onEnableWithSave={handleSaveAndEnable}
        onMessage={toast.show}
      />

      <details
        open={scheduleOpen}
        onToggle={(event) => setScheduleOpen(event.currentTarget.open)}
        className="rounded-2xl border border-line bg-surface shadow-sm"
      >
        <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 transition-colors hover:bg-surface-2/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-6 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span id="cadence-heading" className="block text-base font-bold text-ink">Edit your schedule</span>
            <span className="mt-1 block text-sm text-muted">
              {data.exists ? `${rhythmSummary(savedData ?? data)} · ${savedData?.timezone ?? data.timezone}` : "Choose when Minions should prepare drafts."}
            </span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition-transform ${scheduleOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </summary>
        <div className="space-y-5 border-t border-line p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink">How often should Minions prepare a draft?</h2>
            <p className="text-sm text-muted">Your current rhythm is already selected.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Drafting cadence">
          {CADENCE_OPTIONS.map((option) => {
            const selected = data.cadence_type === option.key;
            return (
              <button
                key={option.key}
                type="button"
                disabled={saving}
                aria-pressed={selected}
                onClick={() => updateData((previous) => ({ ...previous, cadence_type: option.key }))}
                className={`min-h-20 cursor-pointer rounded-xl border-2 px-4 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-brand bg-brand/10" : "border-line bg-[#0B1016] hover:border-brand/60 hover:bg-[#13211F]"}`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-bold text-ink">
                  {option.label} {selected && <Check className="h-4 w-4 text-brand" aria-hidden="true" />}
                </span>
                <span className="mt-1 block text-xs text-muted">{option.hint}</span>
              </button>
            );
          })}
        </div>

        {data.cadence_type === "EVERY_N_DAYS" && (
          <label className="flex flex-wrap items-center gap-3 text-sm text-[#CBD5E1]">
            Make a draft every
            <input
              type="number"
              min={1}
              aria-label="Days between drafts"
              disabled={saving}
              value={data.interval_days ?? 1}
              onChange={(event) => updateData((previous) => ({ ...previous, interval_days: Math.max(1, Number(event.target.value) || 1) }))}
              className="w-20 rounded-lg border border-[#2A3A4B] bg-canvas px-3 py-2 text-base text-ink focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            days
          </label>
        )}

        {data.cadence_type === "DAYS_OF_WEEK" && (
          <div>
            <p className="mb-2 text-sm font-medium text-[#CBD5E1]">Which days?</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Drafting weekdays">
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
                    className={`h-11 min-w-11 cursor-pointer rounded-xl border-2 px-2 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-brand bg-brand/15 text-brand" : "border-line bg-[#0B1016] text-muted hover:border-brand/60"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {missingDay && <p className="mt-2 text-sm text-[#FBBF24]">Choose at least one day to continue.</p>}
          </div>
        )}

        <div className="border-t border-line pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <h3 className="text-sm font-bold text-ink">When should Minions write each draft?</h3>
            <span className="text-xs text-muted">{data.timezone}</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.times_of_day.map((time, index) => (
              <label key={index} className="block text-sm text-[#CBD5E1]">
                <span className="mb-1.5 block">{data.posts_per_day === 1 ? "Draft time" : `Draft ${index + 1}`}</span>
                <input
                  type="time"
                  value={time}
                  disabled={saving}
                  onChange={(event) => updateData((previous) => ({ ...previous, times_of_day: previous.times_of_day.map((entry, i) => i === index ? event.target.value : entry) }))}
                  className="min-h-11 w-full rounded-xl border border-[#2A3A4B] bg-canvas px-3 text-base text-ink [color-scheme:dark] focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            ))}
          </div>
          {missingTime && <p className="mt-2 text-sm text-[#FBBF24]">Choose a time for every draft.</p>}
          {!missingTime && duplicateTime && <p className="mt-2 text-sm text-[#FBBF24]">Give each draft its own time.</p>}
        </div>

        <div className="border-t border-line pt-4">
          <button type="button" aria-expanded={advancedOpen} aria-controls="more-timing" disabled={saving} onClick={() => setAdvancedOpen((open) => !open)} className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-sm font-semibold text-[#CBD5E1] transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50">
            More timing options <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {advancedOpen && (
            <div id="more-timing" className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0B1016] p-3">
              <span className="text-sm text-[#CBD5E1]">Drafts per active day</span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Fewer drafts per day" disabled={saving || data.posts_per_day <= 1} onClick={() => updatePostsPerDay(data.posts_per_day - 1)} className="h-10 w-10 cursor-pointer rounded-xl border border-[#2A3A4B] text-xl text-ink transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40">−</button>
                <span className="w-6 text-center text-base font-bold text-ink" aria-live="polite">{data.posts_per_day}</span>
                <button type="button" aria-label="More drafts per day" disabled={saving || data.posts_per_day >= 4} onClick={() => updatePostsPerDay(data.posts_per_day + 1)} className="h-10 w-10 cursor-pointer rounded-xl border border-[#2A3A4B] text-xl text-ink transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40">+</button>
              </div>
            </div>
          )}
        </div>

      <section aria-labelledby="review-heading" className="space-y-5 rounded-2xl border border-line bg-[#0D1319] p-5 sm:p-6">
        <div>
          <h2 id="review-heading" className="text-base font-bold text-ink">Who publishes?</h2>
          <p className="mt-1 text-sm text-muted">You can keep reviewing drafts or let eligible scheduled posts publish automatically.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Publishing approval">
          <button type="button" disabled={saving} aria-pressed={data.require_review} onClick={() => updateData((previous) => ({ ...previous, require_review: true }))} className={`min-h-32 cursor-pointer rounded-xl border-2 p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${data.require_review ? "border-brand bg-brand/10" : "border-line bg-[#0B1016] hover:border-brand/60"}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-ink"><ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" /> I review each draft {data.require_review && <Check className="ml-auto h-4 w-4 text-brand" aria-hidden="true" />}</span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">Nothing goes live until you approve it in Editorial Studio.</span>
          </button>
          <button type="button" disabled={saving} aria-pressed={!data.require_review} onClick={() => updateData((previous) => ({ ...previous, require_review: false }))} className={`min-h-32 cursor-pointer rounded-xl border-2 p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 ${!data.require_review ? "border-gold bg-gold/10" : "border-line bg-[#0B1016] hover:border-gold/60"}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-ink"><Send className="h-5 w-5 text-gold" aria-hidden="true" /> Publish eligible drafts { !data.require_review && <Check className="ml-auto h-4 w-4 text-gold" aria-hidden="true" />}</span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">Scheduled drafts that pass checks go live automatically. Others wait for you.</span>
          </button>
        </div>
      </section>

      <section aria-label="Review and save your rhythm" className="rounded-2xl border border-brand/40 bg-gradient-to-br from-[#0E2725] to-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">{hasUnsavedChanges ? "Preview · Not saved yet" : "Saved rhythm"}</p>
            <h2 className="mt-1 text-xl font-bold leading-snug text-ink">{rhythmSummary(data)}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" /> Draft times are in {data.timezone}</p>
            <p className="mt-1 text-sm text-[#CBD5E1]">{data.require_review ? "You approve each draft before it is published." : "Eligible scheduled drafts publish automatically after checks."}</p>
          </div>
          {!hasUnsavedChanges && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Up to date</span>}
        </div>
        {saveError && <p role="alert" className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-[#FCD34D]">{saveError}</p>}
        <button type="button" onClick={() => void handleSave()} disabled={saving || !canSave || !hasUnsavedChanges} aria-busy={saving} className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-b-4 border-brand-edge bg-brand px-5 text-sm font-extrabold text-[#06231E] transition-all hover:bg-[#1AD8B6] active:translate-y-0.5 active:border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-subtle disabled:translate-y-0 sm:w-auto">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : hasUnsavedChanges ? <Save className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          {saving ? "Saving schedule…" : hasUnsavedChanges ? "Save schedule" : "Schedule saved"}
        </button>
        {!canSave && <p className="mt-2 text-sm text-[#FBBF24]">{missingDay ? "Choose at least one day above." : missingTime ? "Choose a time for every draft." : duplicateTime ? "Give each draft its own time." : "Choose a valid gap between drafts."}</p>}
      </section>
        </div>
      </details>

      <ContentPlanCard key={planKey} onMessage={toast.show} />

      {toast.message && <div role="status" className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink shadow-2xl">{toast.message}</div>}
    </div>
  );
}
