import { MEMORY_KIND_SOURCE, SOURCE_BUCKETS, bucketOfSourceType, type SourceBucket, type SourceType } from "@/constants/sourceMix";
import type { IcpContext, MemoryContext } from "@/services/authorContext";

/**
 * Decides what each idea in a harvest run is built on (phase 3 of
 * docs/product/authority-flywheel-plan.md). The source mix is a quota kept in
 * code, not a request to the model: each slot gets one seed -- a memory item,
 * an ICP question, or "the most relevant market signal" -- and the prompt
 * tells the model to build on it.
 *
 * The bucket for each slot is the one furthest below its target share across
 * the tenant's recent ideas plus the slots already planned, so the mix holds
 * over time even though one run has only three slots. Deterministic: the same
 * inputs always give the same plan.
 *
 * A memory item one of the last RESEED_GAP ideas was built on is left to rest
 * while anything else can fill the slot: the ICP profile for a question slot,
 * otherwise the next bucket behind its share. A bucket holding one item would
 * otherwise seed the same story every run, and the ideas come out as
 * near-copies. Only when nothing rested is left does an item repeat.
 */

/** How the prompt refers to memory item i and proof claim i. */
export const memoryRef = (i: number) => `M${i + 1}`;
export const proofRef = (i: number) => `P${i + 1}`;

/** Recent ideas counted against the mix. */
const MIX_WINDOW = 30;

/** Recent ideas whose memory items rest for this run: about two runs' worth. */
export const RESEED_GAP = 6;

/**
 * Which part of a memory item an idea is about. One story can carry several
 * posts that make different points, so each reuse of an item takes the next
 * part: its first idea tells the point itself, later ones the lesson, the
 * belief it contradicts, the cost, the check for the reader. None of them
 * needs a fact the item does not state.
 */
export const STORY_PARTS = [
  { id: "CORE", brief: "its main point, told plainly" },
  { id: "LESSON", brief: "the rule the author takes from it" },
  { id: "MYTH", brief: "the common belief it contradicts" },
  { id: "COST", brief: "what ignoring it costs the ICP" },
  { id: "CHECK", brief: "what the ICP should check in their own work, with this as the one example" },
] as const;
export type StoryPart = (typeof STORY_PARTS)[number]["id"];

/** Angles of earlier ideas from the same item, shown so a reuse makes a new point. */
export const WRITTEN_SHOWN = 3;

export type HarvestSeed =
  | {
      kind: "MEMORY";
      ref: string;
      memory_id: string;
      /** The part of the item this idea is about; set by planHarvest. */
      part?: StoryPart;
      /** Angles of recent ideas already built on this item, newest first. */
      written?: string[];
    }
  | { kind: "ICP"; text: string }
  | { kind: "MARKET" }
  | { kind: "OPEN" };

export interface HarvestSlot {
  slot: number;
  bucket: SourceBucket | "OPEN";
  /** Null only for an OPEN slot: nothing to build on but positioning. */
  source_type: SourceType | null;
  pillar: string;
  pillar_brief: string;
  seed: HarvestSeed;
}

export interface HarvestPlanInput {
  /** In prompt order: memory[i] is ref M{i+1}. */
  memory: MemoryContext[];
  icp: IcpContext;
  angles: { pillar: string; brief: string }[];
  mix: Record<SourceBucket, number>;
  /** source_type of the tenant's most recent ideas, newest first. */
  recentSourceTypes: (string | null)[];
  /** memory_ids of the same recent ideas. */
  recentMemoryIds: string[][];
  /** angle of the same recent ideas; optional for older callers. */
  recentAngles?: (string | null)[];
  hasMarketSources: boolean;
  runIndex: number;
}

export function planHarvest(input: HarvestPlanInput): HarvestSlot[] {
  const { memory, icp, angles, mix } = input;
  const total = SOURCE_BUCKETS.reduce((s, b) => s + (mix[b] || 0), 0) || 1;

  const counts = Object.fromEntries(SOURCE_BUCKETS.map((b) => [b, 0])) as Record<SourceBucket, number>;
  let counted = 0;
  for (const t of input.recentSourceTypes.slice(0, MIX_WINDOW)) {
    const b = bucketOfSourceType(t);
    if (b) {
      counts[b]++;
      counted++;
    }
  }

  // Least-used memory first; the given order (least used overall, newest) breaks ties.
  const recentUse = new Map<string, number>();
  for (const ids of input.recentMemoryIds) for (const id of ids) recentUse.set(id, (recentUse.get(id) ?? 0) + 1);
  const ranked = memory
    .map((m, i) => ({ m, i, use: recentUse.get(m.id) ?? 0 }))
    .sort((a, b) => a.use - b.use || a.i - b.i);
  const memoryIn = (b: SourceBucket) => ranked.filter(({ m }) => MEMORY_KIND_SOURCE[m.kind]?.bucket === b);
  const resting = new Set(input.recentMemoryIds.slice(0, RESEED_GAP).flat());

  // The nth idea from an item takes its nth part, so reuse moves to a new point.
  const memorySeed = (pick: { m: MemoryContext; i: number; use: number }): HarvestSeed => {
    const written: string[] = [];
    input.recentMemoryIds.forEach((ids, n) => {
      const angle = input.recentAngles?.[n]?.trim();
      if (angle && ids.includes(pick.m.id) && written.length < WRITTEN_SHOWN) written.push(angle);
    });
    return {
      kind: "MEMORY",
      ref: memoryRef(pick.i),
      memory_id: pick.m.id,
      part: STORY_PARTS[pick.use % STORY_PARTS.length].id,
      ...(written.length ? { written } : {}),
    };
  };

  // Phase 6: an item from a recent weekly answer that no recent idea has used
  // seeds the first slot, whatever the mix says. The author just told us what
  // happened this week; waiting for its bucket to fall behind would bury it.
  const freshPick = ranked.find(({ m, use }) => m.fresh && use === 0 && MEMORY_KIND_SOURCE[m.kind]);

  const icpPrompts = [...icp.questions, ...icp.pains, ...icp.decisions].map((s) => s.trim()).filter(Boolean);
  const taken = new Set<string>();
  let icpUsed = 0;

  const unrested = (b: SourceBucket) => memoryIn(b).find(({ m }) => !taken.has(m.id) && !resting.has(m.id));
  const icpLeft = (b: SourceBucket) => b === "ICP_QUESTION" && icpUsed < icpPrompts.length;
  // Something new to build on, without reusing a resting item.
  const fresh = (b: SourceBucket): boolean => (b === "MARKET" ? input.hasMarketSources : Boolean(unrested(b)) || icpLeft(b));
  // Anything at all, resting items included.
  const available = (b: SourceBucket): boolean => {
    if (b === "MARKET") return input.hasMarketSources;
    if (memoryIn(b).some(({ m }) => !taken.has(m.id))) return true;
    return icpLeft(b);
  };

  return angles.map((angle, idx) => {
    if (idx === 0 && freshPick) {
      const { bucket, sourceType } = MEMORY_KIND_SOURCE[freshPick.m.kind];
      taken.add(freshPick.m.id);
      counts[bucket]++;
      counted++;
      return {
        slot: 1,
        pillar: angle.pillar,
        pillar_brief: angle.brief,
        bucket,
        source_type: sourceType,
        seed: memorySeed(freshPick),
      };
    }
    const furthestBehind = (usable: (b: SourceBucket) => boolean): SourceBucket | null => {
      let best: SourceBucket | null = null;
      let bestScore = -Infinity;
      for (const b of SOURCE_BUCKETS) {
        if (!(mix[b] > 0) || !usable(b)) continue;
        const deficit = (mix[b] / total) * (counted + 1) - counts[b];
        if (deficit > bestScore) {
          best = b;
          bestScore = deficit;
        }
      }
      return best;
    };
    const best = furthestBehind(fresh) ?? furthestBehind(available);
    const base = { slot: idx + 1, pillar: angle.pillar, pillar_brief: angle.brief };
    if (!best) return { ...base, bucket: "OPEN", source_type: null, seed: { kind: "OPEN" } };

    counts[best]++;
    counted++;
    if (best === "MARKET") return { ...base, bucket: best, source_type: "MARKET_SIGNAL", seed: { kind: "MARKET" } };

    // A resting item only when the ICP profile has nothing left for this slot either.
    const pick = unrested(best) ?? (icpLeft(best) ? undefined : memoryIn(best).find(({ m }) => !taken.has(m.id)));
    if (pick) {
      taken.add(pick.m.id);
      return {
        ...base,
        bucket: best,
        source_type: MEMORY_KIND_SOURCE[pick.m.kind].sourceType,
        seed: memorySeed(pick),
      };
    }
    // ICP_QUESTION with no question saved as memory: rotate through the ICP profile.
    const text = icpPrompts[(input.runIndex + icpUsed) % icpPrompts.length];
    icpUsed++;
    return { ...base, bucket: best, source_type: "ICP_QUESTION", seed: { kind: "ICP", text } };
  });
}
