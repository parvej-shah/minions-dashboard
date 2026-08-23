/**
 * Pure cadence math for the posting scheduler -- no I/O, no Prisma. Reused by
 * GET /api/schedule/preview (server-rendered "upcoming slots" list) and by
 * GET /api/internal/schedule/eligible-tenants (the "is this tenant due right
 * now" check the n8n 00b_posting_scheduler_dispatcher workflow polls every 5
 * minutes).
 *
 * n8n can't import TypeScript, so 00b's own Code node re-implements this same
 * algorithm directly in JS. Keep the two in lockstep -- if you change the
 * cadence/window logic here, update that Code node to match.
 *
 * No date library dependency: this project has none (no luxon/date-fns), and
 * native Intl.DateTimeFormat with an IANA `timeZone` handles everything
 * needed here (reading a tenant-local date/time, DST included) without
 * adding one.
 */

export type CadenceType = "DAILY" | "EVERY_N_DAYS" | "DAYS_OF_WEEK";

export interface PostingScheduleConfig {
  cadenceType: string;
  intervalDays: number | null;
  daysOfWeek: number[]; // 0=Sun..6=Sat
  postsPerDay: number;
  timesOfDay: string[]; // "HH:mm", length should == postsPerDay
  isActive: boolean;
  lastRunAt: Date | null;
  createdAt: Date;
}

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=Sun..6=Sat
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Intl reports midnight as "24" with hour12:false in some engines; normalize.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
  };
}

/** Days between two Y-M-D calendar dates, ignoring time-of-day and DST. */
function calendarDaysBetween(a: ZonedParts, b: ZonedParts): number {
  const aUtc = Date.UTC(a.year, a.month - 1, a.day);
  const bUtc = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((bUtc - aUtc) / 86_400_000);
}

function isCadenceDayDue(schedule: PostingScheduleConfig, timezone: string, now: ZonedParts): boolean {
  switch (schedule.cadenceType) {
    case "DAILY":
      return true;
    case "DAYS_OF_WEEK":
      return schedule.daysOfWeek.includes(now.weekday);
    case "EVERY_N_DAYS": {
      const interval = schedule.intervalDays ?? 1;
      if (interval < 1) return true;
      const anchor = zonedParts(schedule.createdAt, timezone);
      const daysSince = calendarDaysBetween(anchor, now);
      return daysSince >= 0 && daysSince % interval === 0;
    }
    default:
      return false;
  }
}

function parseTimeOfDay(hhmm: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Returns the exact slot Date this schedule is due for right now, or null if
 * not due. "Now" matches a slot when today satisfies the cadence type, the
 * clock is within `windowMinutes` after one of timesOfDay, and lastRunAt
 * hasn't already covered that slot (idempotency across dispatcher ticks).
 */
export function computeDueSlot(
  schedule: PostingScheduleConfig,
  timezone: string,
  now: Date = new Date(),
  windowMinutes = 5
): Date | null {
  if (!schedule.isActive) return null;

  const nowParts = zonedParts(now, timezone);
  if (!isCadenceDayDue(schedule, timezone, nowParts)) return null;

  const nowMinutes = nowParts.hour * 60 + nowParts.minute;

  for (const raw of schedule.timesOfDay) {
    const t = parseTimeOfDay(raw);
    if (!t) continue;
    const slotMinutes = t.hour * 60 + t.minute;
    if (nowMinutes < slotMinutes || nowMinutes >= slotMinutes + windowMinutes) continue;

    // Reconstruct this slot's actual instant from now's Y-M-D (in the
    // tenant's zone) + this time-of-day, by offsetting `now` back to the
    // slot minute -- avoids re-deriving a UTC offset by hand.
    const slotDate = new Date(now.getTime() - (nowMinutes - slotMinutes) * 60_000);

    if (schedule.lastRunAt && schedule.lastRunAt.getTime() >= slotDate.getTime()) continue;

    return slotDate;
  }

  return null;
}

/** Computes the next `count` upcoming posting slots from `from`, for the UI's read-only preview. */
export function nextUpcomingSlots(
  schedule: PostingScheduleConfig,
  timezone: string,
  count: number,
  from: Date = new Date()
): Date[] {
  const slots: Date[] = [];
  if (!schedule.isActive || schedule.timesOfDay.length === 0) return slots;

  const sortedTimes = [...schedule.timesOfDay]
    .map(parseTimeOfDay)
    .filter((t): t is { hour: number; minute: number } => t !== null)
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  const MAX_DAYS_AHEAD = 60; // safety bound so a misconfigured cadence can't loop forever
  for (let dayOffset = 0; dayOffset <= MAX_DAYS_AHEAD && slots.length < count; dayOffset++) {
    const candidateDay = new Date(from.getTime() + dayOffset * 86_400_000);
    const dayParts = zonedParts(candidateDay, timezone);
    if (!isCadenceDayDue(schedule, timezone, dayParts)) continue;

    for (const t of sortedTimes) {
      if (slots.length >= count) break;
      // Build this slot's instant from the candidate day's Y-M-D (in the
      // tenant's zone) + this time-of-day, using the same now-minus-offset
      // trick as computeDueSlot, anchored off candidateDay's own zoned parts.
      const candidateMinutes = dayParts.hour * 60 + dayParts.minute;
      const slotMinutes = t.hour * 60 + t.minute;
      const slotDate = new Date(candidateDay.getTime() - (candidateMinutes - slotMinutes) * 60_000);
      if (slotDate.getTime() < from.getTime()) continue;
      slots.push(slotDate);
    }
  }

  return slots;
}
