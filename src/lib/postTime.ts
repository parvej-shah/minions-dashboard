/**
 * Times for scheduling one reviewed post (phase 7). A reviewer picks a local
 * date and time in the workspace's timezone; the server stores the instant.
 * Pure, no I/O, no date library (see src/lib/scheduling.ts for why).
 */

/** The earliest a post can be scheduled: sooner than this is "Publish now". */
export const MIN_LEAD_MINUTES = 10;
/** The latest: a post scheduled further out is almost always a typo. */
export const MAX_DAYS_AHEAD = 180;
/** 03_review_publisher polls every 5 minutes, so a post goes out up to this late. */
export const RELEASE_GRANULARITY_MINUTES = 5;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function offsetMs(instant: Date, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((x) => [x.type, x.value])
  );
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The instant a wall-clock date and time in `tz` names, or null if the input is
 * malformed or the time does not exist there (the hour skipped when clocks go forward).
 */
export function zonedToUtc(date: string, time: string, tz: string): Date | null {
  const d = DATE_RE.exec(date);
  const t = TIME_RE.exec(time);
  if (!d || !t) return null;
  const wall = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  if (new Date(wall).getUTCDate() !== Number(d[3])) return null; // 2026-02-30
  // Two passes settle the offset across a DST change.
  let guess = wall - offsetMs(new Date(wall), tz);
  guess = wall - offsetMs(new Date(guess), tz);
  const back = utcToZoned(new Date(guess), tz);
  return back.date === date && back.time === time ? new Date(guess) : null;
}

/** An instant as the workspace's local date (YYYY-MM-DD) and time (HH:mm). */
export function utcToZoned(instant: Date, tz: string): { date: string; time: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((x) => [x.type, x.value])
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export type ScheduleCheck = { ok: true; at: Date } | { ok: false; error: string };

/** Whether a post may be scheduled for this local date and time. */
export function checkScheduleTime(date: string, time: string, tz: string, now: Date = new Date()): ScheduleCheck {
  const at = zonedToUtc(date, time, tz);
  if (!at) return { ok: false, error: "That date and time don't exist in the workspace's timezone. Pick another." };
  if (at.getTime() < now.getTime() + MIN_LEAD_MINUTES * 60_000) {
    return { ok: false, error: `Pick a time at least ${MIN_LEAD_MINUTES} minutes from now, or publish now.` };
  }
  if (at.getTime() > now.getTime() + MAX_DAYS_AHEAD * 86_400_000) {
    return { ok: false, error: `Pick a time within the next ${MAX_DAYS_AHEAD} days.` };
  }
  return { ok: true, at };
}

/** "Mon, Sep 28, 9:00 AM" in the workspace's timezone. */
export function formatPostTime(instant: Date | string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(instant));
}
