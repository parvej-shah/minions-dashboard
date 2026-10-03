/**
 * When the weekly question is asked (phase 6 of
 * docs/product/authority-flywheel-plan.md). All in the tenant's timezone:
 * a week runs Monday to Sunday there, and the question appears from the
 * tenant's pulse day (Friday by default) to the end of that Sunday.
 *
 * Nothing piles up: a week with no visit on or after the pulse day is never
 * asked, and the next Monday starts a new week.
 */

export const PULSE_QUESTION = "What did you build, learn, notice, or change your mind about this week?";
const DEFAULT_PULSE_DAY = 5;
export const PULSE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return Boolean(tz);
  } catch {
    return false;
  }
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  /** 1 = Monday ... 7 = Sunday. */
  weekday: number;
  /** Milliseconds since local midnight. */
  msOfDay: number;
}

const WEEKDAY: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function localParts(now: Date, tz: string): LocalParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAY[parts.weekday],
    msOfDay: ((Number(parts.hour) * 60 + Number(parts.minute)) * 60 + Number(parts.second)) * 1000 + now.getMilliseconds(),
  };
}

/** This week's Monday in the tenant's timezone, as YYYY-MM-DD. */
export function weekStart(now: Date, tz: string): string {
  const p = localParts(now, tz);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day - (p.weekday - 1)));
  return d.toISOString().slice(0, 10);
}

/** The next local midnight: "snooze until tomorrow". */
export function nextLocalMidnight(now: Date, tz: string): Date {
  return new Date(now.getTime() + 24 * 3600_000 - localParts(now, tz).msOfDay);
}

export interface PulseRowState {
  status: string;
  snoozedUntil: Date | null;
}

export type PulseState =
  | { kind: "OFF" }
  | { kind: "NOT_YET"; opensOn: string }
  | { kind: "DUE" }
  | { kind: "CONFIRM" }
  | { kind: "SNOOZED"; until: Date }
  | { kind: "DONE"; status: "ANSWERED" | "SKIPPED" };

/** What the home card shows this week. */
export function pulseState(
  now: Date,
  tz: string,
  settings: { enabled: boolean; day: number },
  row: PulseRowState | null
): PulseState {
  if (!settings.enabled) return { kind: "OFF" };
  if (row?.status === "ANSWERED" || row?.status === "SKIPPED") return { kind: "DONE", status: row.status };
  // Answered but not confirmed: the confirm step stays open all week.
  if (row?.status === "EXTRACTED") return { kind: "CONFIRM" };
  const day = settings.day >= 1 && settings.day <= 7 ? settings.day : DEFAULT_PULSE_DAY;
  if (localParts(now, tz).weekday < day) return { kind: "NOT_YET", opensOn: PULSE_DAYS[day - 1] };
  if (row?.status === "SNOOZED" && row.snoozedUntil && row.snoozedUntil > now) return { kind: "SNOOZED", until: row.snoozedUntil };
  return { kind: "DUE" };
}
