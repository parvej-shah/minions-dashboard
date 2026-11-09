"use client";

import React, { useEffect, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { MIN_LEAD_MINUTES, RELEASE_GRANULARITY_MINUTES, utcToZoned } from "@/lib/postTime";

import { buttonStyles } from "@/components/ui/Button";
interface ScheduleSettings {
  timezone: string;
  times_of_day: string[];
}

let cached: Promise<ScheduleSettings> | null = null;
/** The workspace's timezone and posting times, fetched once per page load. */
function loadSettings(): Promise<ScheduleSettings> {
  cached ??= apiClient.get<ScheduleSettings>("/api/schedule").catch((e) => {
    cached = null;
    throw e;
  });
  return cached;
}

/** The workspace's timezone, or null until it has loaded. */
export function useWorkspaceTimezone(): string | null {
  const [tz, setTz] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadSettings().then((s) => live && setTz(s.timezone)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return tz;
}

/** "New York time" from "America/New_York". */
export function zoneLabel(tz: string): string {
  return `${tz.split("/").pop()!.replace(/_/g, " ")} time`;
}

/**
 * The first sensible time to offer: the current scheduled time when moving a
 * post, otherwise tomorrow at the workspace's first posting time (09:00 if none).
 */
function initialValue(tz: string, times: string[], current: string | null): { date: string; time: string } {
  if (current && new Date(current).getTime() > Date.now()) return utcToZoned(new Date(current), tz);
  const tomorrow = utcToZoned(new Date(Date.now() + 86_400_000), tz);
  const first = [...times].sort()[0];
  return { date: tomorrow.date, time: /^\d{2}:\d{2}$/.test(first ?? "") ? first : "09:00" };
}

export interface SchedulePickerProps {
  /** The post's current scheduled time, when moving it. */
  current: string | null;
  busy: boolean;
  confirmLabel: string;
  onConfirm: (date: string, time: string) => void;
  onCancel: () => void;
}

/**
 * Pick the local date and time a reviewed post goes out, in the workspace's
 * timezone (not the browser's), so what the reviewer types is what the
 * audience sees. The server checks the time again.
 */
export default function SchedulePicker({ current, busy, confirmLabel, onConfirm, onCancel }: SchedulePickerProps) {
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [value, setValue] = useState<{ date: string; time: string } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadSettings()
      .then((s) => {
        if (!live) return;
        setSettings(s);
        setValue(initialValue(s.timezone, s.times_of_day ?? [], current));
      })
      .catch(() => live && setLoadFailed(true));
    return () => {
      live = false;
    };
  }, [current]);

  if (loadFailed) {
    return <p className="text-[11px] text-gold">Could not load the workspace&apos;s timezone. Reload the page and try again.</p>;
  }
  if (!settings || !value) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <RefreshCw className="w-3 h-3 animate-spin" /> Loading…
      </div>
    );
  }

  const today = utcToZoned(new Date(), settings.timezone).date;
  const inputClass =
    "w-full bg-canvas border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-brand";

  return (
    <form
      className="space-y-2 rounded-xl border border-line bg-surface-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(value.date, value.time);
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] font-medium text-muted block mb-1">Date</span>
          <input type="date" required min={today} value={value.date} onChange={(e) => setValue({ ...value, date: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-muted block mb-1">Time</span>
          <input type="time" required step={300} value={value.time} onChange={(e) => setValue({ ...value, time: e.target.value })} className={inputClass} />
        </label>
      </div>
      <p className="text-[10px] leading-relaxed text-subtle">
        {zoneLabel(settings.timezone)}. It goes out within {RELEASE_GRANULARITY_MINUTES} minutes of this time, at least {MIN_LEAD_MINUTES} minutes from now.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !value.date || !value.time}
          className={buttonStyles({ size: "sm", className: "flex-1" })}
        >
          {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg bg-canvas border border-line text-xs text-ink cursor-pointer">
          Close
        </button>
      </div>
    </form>
  );
}
