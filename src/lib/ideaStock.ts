/**
 * At most IDEA_CAP ideas wait unused at once. The 01 harvester stops at the cap
 * and only adds what still fits (its Backlog Guard repeats the number, since
 * n8n Code nodes cannot import it). When the author adds their own material,
 * the oldest waiting ideas make room for the ideas that material produces.
 */
export const IDEA_CAP = 10;
/** Slots freed before a harvest from new material: about one harvest's worth. */
export const ROOM_FOR_MATERIAL = 5;
/** Waiting to be drafted: not claimed, drafted, published or gate-rejected. */
export const UNUSED_IDEA_STATUSES = ["HARVESTED", "REFINED", "QUEUED"];
/** Harvests started by the author adding their own material. */
export const MATERIAL_TRIGGERS = ["WEEKLY_PULSE", "STORY_SESSION"];

export interface StockIdea {
  id: string;
  createdAt: Date;
  memoryIds: string[];
}

/**
 * Which unused ideas to discard so `keep` remain: ideas from news and other
 * outside sources go before ideas from the author's own material, oldest first.
 */
export function ideasToDiscard(unused: StockIdea[], keep: number): string[] {
  const extra = unused.length - Math.max(0, keep);
  if (extra <= 0) return [];
  const order = [...unused].sort(
    (a, b) => Number(a.memoryIds.length > 0) - Number(b.memoryIds.length > 0) || a.createdAt.getTime() - b.createdAt.getTime()
  );
  return order.slice(0, extra).map((i) => i.id);
}
