/**
 * The slot filler (phase 7 of docs/product/authority-flywheel-plan.md).
 * Every slot gets a post idea (D17); which one is decided here, in code:
 *
 *   1. the strongest idea that passes the gate in the slot's lane,
 *   2. the strongest that passes in any other active lane,
 *   3. a targeted harvest for the slot's lane, once per slot,
 *   4. at the slot's time only: the best idea below the bar. Its draft is
 *      labelled and always waits for review.
 *
 * Pure: no I/O. src/services/contentPlan.ts reads and writes the rows.
 */

export const OBJECTIVES = ["AUTHORITY", "CREDIBILITY", "DEMAND"] as const;
export type Objective = (typeof OBJECTIVES)[number];

const FILL_METHODS = ["LANE", "OTHER_LANE", "TARGETED_HARVEST", "BELOW_BAR"] as const;
export type FillMethod = (typeof FILL_METHODS)[number];

/** How each method reads in the week view. */
export const FILL_METHOD_LABEL: Record<FillMethod, string> = {
  LANE: "From its lane",
  OTHER_LANE: "From another lane",
  TARGETED_HARVEST: "Found for this slot",
  BELOW_BAR: "Below the usual bar",
};

/** Lane choices remembered when balancing lanes against their weights. */
export const LANE_HISTORY = 12;
/** How far ahead the look-ahead plans and reserves. */
export const LOOKAHEAD_DAYS = 7;
/** A targeted harvest that has not produced a usable idea after this long is spent. */
export const HARVEST_WAIT_MINUTES = 90;

export interface PlanLane {
  id: string;
  name: string;
  purpose: string;
  weight: number;
  sortOrder: number;
  isActive: boolean;
}

export interface PlanIdea {
  id: string;
  laneId: string | null;
  /** PASS | BELOW_BAR | REJECT | null (never gated: an idea from before phase 3). */
  gateVerdict: string | null;
  gateReasons: string[];
  score: number;
  createdAt: Date;
}

/** "1@09:00": Monday at 09:00. Keys `slot_lanes`. */
export function slotKey(weekday: number, time: string): string {
  return `${weekday}@${time}`;
}

function objectiveBoost(purpose: string, primary: Objective, secondary: Objective | null): number {
  if (purpose === primary) return 2;
  if (secondary && purpose === secondary) return 1.5;
  return 1;
}

/**
 * The lane a slot serves. A pinned lane wins while it is active. Otherwise the
 * lane furthest behind its share: each active lane's weight, boosted for the
 * plan's objectives, against how often it was chosen in the recent slots.
 * Deterministic: ties go to the lane listed first.
 */
export function chooseLane(
  lanes: PlanLane[],
  recentLaneIds: (string | null)[],
  objectives: { primary: Objective; secondary: Objective | null },
  pinnedLaneId?: string | null
): PlanLane | null {
  const usable = lanes.filter((l) => l.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const pinned = pinnedLaneId ? usable.find((l) => l.id === pinnedLaneId) : undefined;
  if (pinned) return pinned;

  const weighted = usable
    .map((l) => ({ lane: l, w: Math.max(0, l.weight) * objectiveBoost(l.purpose, objectives.primary, objectives.secondary) }))
    .filter((x) => x.w > 0);
  if (!weighted.length) return usable[0] ?? null;

  const total = weighted.reduce((s, x) => s + x.w, 0);
  const history = recentLaneIds.slice(0, LANE_HISTORY);
  const n = history.length + 1;
  let best: { lane: PlanLane; deficit: number } | null = null;
  for (const { lane, w } of weighted) {
    const used = history.filter((id) => id === lane.id).length;
    const deficit = (w / total) * n - used;
    if (!best || deficit > best.deficit + 1e-9) best = { lane, deficit };
  }
  return best!.lane;
}

/** Strongest first: the gate's score, then the newest. */
function rankIdeas(ideas: PlanIdea[]): PlanIdea[] {
  return [...ideas].sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime());
}

export type FillDecision =
  | { kind: "IDEA"; ideaId: string; method: FillMethod; reasons: string[] }
  /** Ask the harvester for ideas in this lane, then try again. */
  | { kind: "HARVEST" }
  /** Nothing good yet, and it is not the slot's time: keep looking. */
  | { kind: "WAIT" }
  /** Nothing to draft at all. */
  | { kind: "EMPTY" };

export interface FillInput {
  laneId: string | null;
  /** Ideas free to use: undrafted, unclaimed, not reserved by another slot. */
  ideas: PlanIdea[];
  activeLaneIds: string[];
  /** LOOKAHEAD reserves only ideas that pass; DUE is the slot's time, when a below-bar idea is used. */
  phase: "LOOKAHEAD" | "DUE";
  /** When a targeted harvest was asked for this slot, or null. */
  harvestRequestedAt: Date | null;
  /** False when today's harvest budget is spent. */
  harvestAllowed: boolean;
}

function belowBarReasons(idea: PlanIdea): string[] {
  if (idea.gateVerdict === null) return ["not checked by the idea gate"];
  return idea.gateReasons.length ? idea.gateReasons : ["scored below the gate's bar"];
}

export function fillSlot(input: FillInput): FillDecision {
  const usable = input.ideas.filter((i) => i.gateVerdict !== "REJECT");
  const passing = rankIdeas(usable.filter((i) => i.gateVerdict === "PASS"));
  const harvested = (i: PlanIdea) => input.harvestRequestedAt !== null && i.createdAt >= input.harvestRequestedAt;

  const inLane = input.laneId ? passing.find((i) => i.laneId === input.laneId) : undefined;
  if (inLane) return { kind: "IDEA", ideaId: inLane.id, method: harvested(inLane) ? "TARGETED_HARVEST" : "LANE", reasons: [] };

  const otherLane = passing.find((i) => i.laneId !== null && input.activeLaneIds.includes(i.laneId)) ?? passing[0];
  if (otherLane) return { kind: "IDEA", ideaId: otherLane.id, method: harvested(otherLane) ? "TARGETED_HARVEST" : "OTHER_LANE", reasons: [] };

  if (input.harvestRequestedAt === null && input.harvestAllowed) return { kind: "HARVEST" };

  if (input.phase === "LOOKAHEAD") return { kind: "WAIT" };

  // Below the bar: prefer the slot's own lane, then the strongest anywhere.
  const below = rankIdeas(usable);
  const pick = (input.laneId ? below.find((i) => i.laneId === input.laneId) : undefined) ?? below[0];
  if (pick) return { kind: "IDEA", ideaId: pick.id, method: "BELOW_BAR", reasons: belowBarReasons(pick) };
  return { kind: "EMPTY" };
}

/** The review note on a below-bar draft (D17: never passed off as a strong one). */
export function belowBarNote(reasons: string[]): string {
  return `Below the usual bar: ${reasons.join("; ")}. Chosen because no stronger idea was ready for this slot.`;
}
