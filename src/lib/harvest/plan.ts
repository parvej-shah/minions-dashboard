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
 */

/** How the prompt refers to memory item i and proof claim i. */
export const memoryRef = (i: number) => `M${i + 1}`;
export const proofRef = (i: number) => `P${i + 1}`;

/** Recent ideas counted against the mix. */
export const MIX_WINDOW = 30;

export type HarvestSeed =
  | { kind: "MEMORY"; ref: string; memory_id: string }
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

  const icpPrompts = [...icp.questions, ...icp.pains, ...icp.decisions].map((s) => s.trim()).filter(Boolean);
  const taken = new Set<string>();
  let icpUsed = 0;

  const available = (b: SourceBucket): boolean => {
    if (b === "MARKET") return input.hasMarketSources;
    if (memoryIn(b).some(({ m }) => !taken.has(m.id))) return true;
    return b === "ICP_QUESTION" && icpUsed < icpPrompts.length;
  };

  return angles.map((angle, idx) => {
    let best: SourceBucket | null = null;
    let bestScore = -Infinity;
    for (const b of SOURCE_BUCKETS) {
      if (!(mix[b] > 0) || !available(b)) continue;
      const deficit = (mix[b] / total) * (counted + 1) - counts[b];
      if (deficit > bestScore) {
        best = b;
        bestScore = deficit;
      }
    }
    const base = { slot: idx + 1, pillar: angle.pillar, pillar_brief: angle.brief };
    if (!best) return { ...base, bucket: "OPEN", source_type: null, seed: { kind: "OPEN" } };

    counts[best]++;
    counted++;
    if (best === "MARKET") return { ...base, bucket: best, source_type: "MARKET_SIGNAL", seed: { kind: "MARKET" } };

    const pick = memoryIn(best).find(({ m }) => !taken.has(m.id));
    if (pick) {
      taken.add(pick.m.id);
      return {
        ...base,
        bucket: best,
        source_type: MEMORY_KIND_SOURCE[pick.m.kind].sourceType,
        seed: { kind: "MEMORY", ref: memoryRef(pick.i), memory_id: pick.m.id },
      };
    }
    // ICP_QUESTION with no question saved as memory: rotate through the ICP profile.
    const text = icpPrompts[(input.runIndex + icpUsed) % icpPrompts.length];
    icpUsed++;
    return { ...base, bucket: best, source_type: "ICP_QUESTION", seed: { kind: "ICP", text } };
  });
}
