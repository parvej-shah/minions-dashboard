/**
 * Which upcoming slots to draft now (task 108). A slot is drafted a day ahead
 * so the post is ready, and on Autopilot already scheduled, before its time.
 *
 * Pure: no I/O. src/services/dueTenants.ts reads the rows and acts on this.
 */

/** How far ahead of its time a slot is drafted. */
export const DRAFT_LEAD_HOURS = 24;

const HOUR_MS = 3_600_000;

/**
 * The slots that fall within the lead window from `now` and are not yet
 * handled, soonest first. `handled` holds slot instants (ms) already drafted
 * or given up on, so one tick after another never drafts a slot twice.
 */
export function slotsToDraftNow(slots: Date[], now: Date, handled: Set<number> = new Set(), leadHours = DRAFT_LEAD_HOURS): Date[] {
  const from = now.getTime();
  const until = from + leadHours * HOUR_MS;
  return slots
    .filter((s) => s.getTime() >= from && s.getTime() <= until && !handled.has(s.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
}

/** Autopilot's offer shows once a workspace is this many days old. */
export const AUTOPILOT_OFFER_DAYS = 7;

export function autopilotOffered(createdAt: Date, requireReview: boolean, now: Date): boolean {
  return requireReview && now.getTime() - createdAt.getTime() >= AUTOPILOT_OFFER_DAYS * 24 * HOUR_MS;
}
