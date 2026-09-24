import { describe, expect, it } from "vitest";
import { DEFAULT_SOURCE_MIX, resolveSourceMix } from "@/constants/sourceMix";
import type { MemoryContext } from "@/services/authorContext";
import { planHarvest, type HarvestPlanInput } from "./plan";

const mem = (id: string, kind: MemoryContext["kind"]): MemoryContext => ({ id, kind, content: `${kind} item ${id}`, disclosure: "PUBLIC", used_count: 0 });
const MEMORY = [
  mem("cw1", "CURRENT_WORK"),
  mem("cw2", "CURRENT_WORK"),
  mem("st1", "STORY"),
  mem("op1", "OPINION"),
  mem("q1", "ICP_QUESTION"),
  mem("ex1", "EXPERIMENT"),
];
const ANGLES = [1, 2, 3].map((i) => ({ pillar: `A${i}`, brief: `brief ${i}` }));
const ICP = { who: "Owners", role: "", company_type: "", pains: ["Missed calls"], decisions: [], questions: ["Will callers hang up?"], buying_triggers: [], vocabulary: [] };

function input(over: Partial<HarvestPlanInput> = {}): HarvestPlanInput {
  return { memory: MEMORY, icp: ICP, angles: ANGLES, mix: { ...DEFAULT_SOURCE_MIX }, recentSourceTypes: [], recentMemoryIds: [], hasMarketSources: true, runIndex: 0, ...over };
}

/** Runs the planner for many consecutive harvests, feeding each run's ideas back as history. */
function simulate(runs: number, over: Partial<HarvestPlanInput> = {}) {
  const types: (string | null)[] = [];
  const ids: string[][] = [];
  for (let r = 0; r < runs; r++) {
    const plan = planHarvest(input({ ...over, recentSourceTypes: [...types], recentMemoryIds: [...ids], runIndex: r }));
    for (const s of plan) {
      types.unshift(s.source_type);
      ids.unshift(s.seed.kind === "MEMORY" ? [s.seed.memory_id] : []);
    }
  }
  return types;
}

describe("planHarvest keeps the source mix in code", () => {
  it("gives one slot per angle, carrying the angle", () => {
    const plan = planHarvest(input());
    expect(plan.map((s) => s.pillar)).toEqual(["A1", "A2", "A3"]);
    expect(plan.map((s) => s.slot)).toEqual([1, 2, 3]);
  });

  it("starts with the largest buckets when there is no history", () => {
    expect(planHarvest(input()).map((s) => s.bucket)).toEqual(["CURRENT_WORK", "EXPERIENCE", "ICP_QUESTION"]);
  });

  it("converges on the 35/25/20/15/5 mix over many runs", () => {
    const types = simulate(40);
    const share = (pred: (t: string | null) => boolean) => types.filter(pred).length / types.length;
    expect(share((t) => t === "CURRENT_WORK" || t === "BUILD_IN_PUBLIC")).toBeCloseTo(0.35, 1);
    expect(share((t) => t === "PAST_EXPERIENCE" || t === "PROFESSIONAL_OPINION")).toBeCloseTo(0.25, 1);
    expect(share((t) => t === "ICP_QUESTION")).toBeCloseTo(0.2, 1);
    expect(share((t) => t === "MARKET_SIGNAL")).toBeCloseTo(0.15, 1);
    expect(share((t) => t === "EXPERIMENT")).toBeCloseTo(0.05, 1);
  });

  it("never seeds two slots with the same memory item in one run", () => {
    const only = { CURRENT_WORK: 100, EXPERIENCE: 0, ICP_QUESTION: 0, MARKET: 0, EXPERIMENTAL: 0 };
    const plan = planHarvest(input({ mix: only }));
    expect(plan.map((s) => (s.seed.kind === "MEMORY" ? s.seed.memory_id : s.seed.kind))).toEqual(["cw1", "cw2", "OPEN"]);
  });

  it("reaches for the least-used memory item first", () => {
    const plan = planHarvest(input({ recentMemoryIds: [["cw1"], ["cw1"]] }));
    expect(plan[0].seed).toMatchObject({ kind: "MEMORY", memory_id: "cw2" });
  });

  it("skips a bucket with nothing to build on", () => {
    const plan = planHarvest(input({ memory: [], hasMarketSources: true }));
    expect(plan.map((s) => s.bucket)).toEqual(["ICP_QUESTION", "MARKET", "ICP_QUESTION"]);
    expect(plan[0].seed).toEqual({ kind: "ICP", text: "Will callers hang up?" });
    expect(plan[2].seed).toEqual({ kind: "ICP", text: "Missed calls" });
  });

  it("falls back to open slots when a tenant has nothing at all yet", () => {
    const empty = { ...ICP, pains: [], questions: [] };
    const plan = planHarvest(input({ memory: [], icp: empty, hasMarketSources: false }));
    expect(plan.every((s) => s.bucket === "OPEN" && s.source_type === null)).toBe(true);
  });

  it("maps a memory kind to its source type", () => {
    const plan = planHarvest(input({ memory: [mem("o", "OPINION")], mix: { ...DEFAULT_SOURCE_MIX, CURRENT_WORK: 0, ICP_QUESTION: 0, MARKET: 0, EXPERIMENTAL: 0 } }));
    expect(plan[0]).toMatchObject({ bucket: "EXPERIENCE", source_type: "PROFESSIONAL_OPINION" });
  });
});

describe("resolveSourceMix", () => {
  it("uses the default for anything malformed", () => {
    for (const raw of [null, "x", [], {}, { CURRENT_WORK: -5 }]) expect(resolveSourceMix(raw)).toEqual(DEFAULT_SOURCE_MIX);
  });

  it("keeps a tenant override, with omitted buckets at 0", () => {
    expect(resolveSourceMix({ CURRENT_WORK: 50, MARKET: 50 })).toEqual({ CURRENT_WORK: 50, EXPERIENCE: 0, ICP_QUESTION: 0, MARKET: 50, EXPERIMENTAL: 0 });
  });
});

describe("a weekly answer seeds the next harvest (phase 6)", () => {
  const fresh = { ...mem("wk", "LESSON"), fresh: true };

  it("puts an unused fresh item in slot 1, whatever the mix says", () => {
    const plan = planHarvest(input({ memory: [...MEMORY, fresh] }));
    expect(plan[0].seed).toEqual({ kind: "MEMORY", ref: `M${MEMORY.length + 1}`, memory_id: "wk" });
    expect(plan[0].bucket).toBe("EXPERIENCE");
    // The other slots still follow the mix, and never reuse it.
    expect(plan.slice(1).some((s) => s.seed.kind === "MEMORY" && s.seed.memory_id === "wk")).toBe(false);
  });

  it("stops forcing it once a recent idea has used it", () => {
    const plan = planHarvest(input({ memory: [...MEMORY, fresh], recentMemoryIds: [["wk"]] }));
    expect(plan[0].seed).not.toEqual(expect.objectContaining({ memory_id: "wk" }));
  });

  it("changes nothing when no item is fresh", () => {
    expect(planHarvest(input({ memory: [...MEMORY, mem("wk", "LESSON")] }))[0]).toEqual(planHarvest(input())[0]);
  });
});
