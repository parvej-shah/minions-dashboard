/**
 * The next posting time a reviewer can approve a draft into: far enough ahead
 * to schedule, and not already held by another scheduled post.
 */
export function nextFreeSlot(slots: string[], takenIso: string[], nowMs: number, minLeadMinutes: number): string | null {
  const taken = new Set(takenIso.map((t) => Date.parse(t)));
  const earliest = nowMs + minLeadMinutes * 60_000;
  return slots.find((s) => Date.parse(s) >= earliest && !taken.has(Date.parse(s))) ?? null;
}
