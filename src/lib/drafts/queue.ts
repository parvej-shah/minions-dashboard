import type { AssetItem } from "@/types";

export type QueueFilter = "ALL" | "PENDING_REVIEW" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED" | "DRAFT";

type Queued = Pick<AssetItem, "id" | "status">;

/** The drafts a Studio filter shows, in the Studio's order. */
export function queueFor<T extends Queued>(assets: T[], filter: QueueFilter): T[] {
  return filter === "ALL" || filter === "DRAFT" ? assets : assets.filter((a) => a.status === filter);
}

/**
 * The draft delta steps away from activeId inside list, wrapping at the ends.
 * A draft that has left the list (just published from "To review") steps to
 * the one now in its place.
 */
export function stepWithin<T extends Queued>(list: T[], all: T[], activeId: string, delta: number): T | null {
  if (list.length === 0) return null;
  const here = list.findIndex((a) => a.id === activeId);
  if (here >= 0) return list.length > 1 ? list[(here + delta + list.length) % list.length] : null;
  // Gone from the list: the first listed draft after it in the full order.
  const at = all.findIndex((a) => a.id === activeId);
  const after = list.find((a) => all.findIndex((b) => b.id === a.id) > at);
  return delta > 0 ? (after ?? list[0]) : (list[list.indexOf(after ?? list[0]) - 1] ?? list[list.length - 1]);
}

/** The next draft waiting for review after activeId, or null when none is left. */
export function nextPending<T extends Queued>(assets: T[], activeId: string): T | null {
  const pending = queueFor(assets, "PENDING_REVIEW");
  return stepWithin(pending, assets, activeId, 1) ?? pending.find((a) => a.id !== activeId) ?? null;
}
