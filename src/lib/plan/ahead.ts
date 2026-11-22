/**
 * Which upcoming slots to draft now (task 108). A slot is drafted a day ahead
 * so the post is ready, and on Autopilot already scheduled, before its time.
 *
 * Pure: no I/O. src/services/dueTenants.ts reads the rows and acts on this.
 */

/** How far ahead of its time a slot is drafted. */
export const DRAFT_LEAD_HOURS = 24;

const HOUR_MS = 3_600_000;

/** Autopilot drafts and schedules this far ahead (task 121). */
export const AUTOPILOT_LEAD_HOURS = 7 * 24;

/** Review first keeps at least this many upcoming slots drafted (task 121). */
export const REVIEW_MIN_SLOTS = 3;

/**
 * The slots to draft now, soonest first: those within the lead window, plus the
 * next `minSlots` upcoming slots however far off, so a workspace never has an
 * empty queue. `handled` holds slot instants (ms) already drafted or given up
 * on; they count toward `minSlots` but are never drafted twice.
 */
export function slotsToDraftNow(
  slots: Date[],
  now: Date,
  handled: Set<number> = new Set(),
  opts: { leadHours?: number; minSlots?: number } = {},
): Date[] {
  const { leadHours = DRAFT_LEAD_HOURS, minSlots = 0 } = opts;
  const from = now.getTime();
  const until = from + leadHours * HOUR_MS;
  return slots
    .filter((s) => s.getTime() >= from)
    .sort((a, b) => a.getTime() - b.getTime())
    .filter((s, i) => (s.getTime() <= until || i < minSlots) && !handled.has(s.getTime()));
}

/** Autopilot's offer shows once a workspace is this many days old. */
export const AUTOPILOT_OFFER_DAYS = 7;

export function autopilotOffered(createdAt: Date, requireReview: boolean, now: Date): boolean {
  return requireReview && now.getTime() - createdAt.getTime() >= AUTOPILOT_OFFER_DAYS * 24 * HOUR_MS;
}
