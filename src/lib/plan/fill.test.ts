import { describe, expect, it } from "vitest";
import { belowBarNote, chooseLane, fillSlot, type FillInput, type PlanIdea, type PlanLane } from "./fill";

const lane = (id: string, purpose: string, weight: number, sortOrder: number, isActive = true): PlanLane => ({ id, name: id, purpose, weight, sortOrder, isActive });
const LANES = [lane("problems", "AUTHORITY", 3, 1), lane("lessons", "CREDIBILITY", 2, 2), lane("decisions", "DEMAND", 1, 3), lane("build", "CREDIBILITY", 0, 4)];
const AUTH = { primary: "AUTHORITY" as const, secondary: null };

const idea = (id: string, laneId: string | null, gateVerdict: string | null, score: number, day = 1, gateReasons: string[] = []): PlanIdea => ({
  id,
  laneId,
  gateVerdict,
  gateReasons,
  score,
  createdAt: new Date(Date.UTC(2026, 8, day)),
});

describe("which lane a slot serves", () => {
  it("honours a pinned lane while it is active", () => {
    expect(chooseLane(LANES, [], AUTH, "decisions")?.id).toBe("decisions");
    expect(chooseLane([...LANES.slice(0, 2), lane("decisions", "DEMAND", 1, 3, false)], [], AUTH, "decisions")?.id).toBe("problems");
  });

  it("follows the weights over a run of slots, and never picks a weight-0 lane", () => {
    const history: string[] = [];
    for (let i = 0; i < 12; i++) history.unshift(chooseLane(LANES, history, { primary: "CREDIBILITY", secondary: null })!.id);
    const count = (id: string) => history.filter((h) => h === id).length;
    // Effective weights: problems 3, lessons 2 x 2 = 4, decisions 1.
    expect([count("problems"), count("lessons"), count("decisions"), count("build")]).toEqual([5, 6, 1, 0]);
  });

  it("is the first lane when history is empty", () => {
    expect(chooseLane(LANES, [], AUTH)?.id).toBe("problems");
  });
});

describe("filling a slot (D17)", () => {
  const base: FillInput = { laneId: "lessons", ideas: [], activeLaneIds: ["problems", "lessons", "decisions"], phase: "LOOKAHEAD", harvestRequestedAt: null, harvestAllowed: true };

  it("takes the strongest passing idea in the slot's lane", () => {
    const ideas = [idea("a", "lessons", "PASS", 70), idea("b", "lessons", "PASS", 85), idea("c", "problems", "PASS", 99)];
    expect(fillSlot({ ...base, ideas })).toEqual({ kind: "IDEA", ideaId: "b", method: "LANE", reasons: [] });
  });

  it("falls back to another lane, then a targeted harvest", () => {
    expect(fillSlot({ ...base, ideas: [idea("c", "problems", "PASS", 60)] })).toMatchObject({ ideaId: "c", method: "OTHER_LANE" });
    expect(fillSlot({ ...base, ideas: [idea("d", "lessons", "BELOW_BAR", 40)] })).toEqual({ kind: "HARVEST" });
  });

  it("credits an idea the targeted harvest produced", () => {
    const ideas = [idea("new", "lessons", "PASS", 70, 20)];
    expect(fillSlot({ ...base, ideas, harvestRequestedAt: new Date(Date.UTC(2026, 8, 19)) })).toMatchObject({ method: "TARGETED_HARVEST" });
  });

  it("waits ahead of time, and uses a below-bar idea only at the slot's time, with its reasons", () => {
    const ideas = [idea("d", "lessons", "BELOW_BAR", 40, 1, ["no author advantage"]), idea("e", "problems", "BELOW_BAR", 55), idea("r", "lessons", "REJECT", 90)];
    const harvested = { ...base, ideas, harvestRequestedAt: new Date(Date.UTC(2026, 8, 2)) };
    expect(fillSlot(harvested)).toEqual({ kind: "WAIT" });
    expect(fillSlot({ ...harvested, phase: "DUE" })).toEqual({ kind: "IDEA", ideaId: "d", method: "BELOW_BAR", reasons: ["no author advantage"] });
    expect(fillSlot({ ...base, ideas, phase: "DUE", harvestAllowed: false })).toMatchObject({ ideaId: "d", method: "BELOW_BAR" });
  });

  it("names an ungated idea as such, and is EMPTY with nothing at all", () => {
    const due = { ...base, phase: "DUE" as const, harvestAllowed: false };
    expect(fillSlot({ ...due, ideas: [idea("old", null, null, 0)] })).toMatchObject({ reasons: ["not checked by the idea gate"] });
    expect(fillSlot({ ...due, ideas: [idea("r", "lessons", "REJECT", 90)] })).toEqual({ kind: "EMPTY" });
  });

  it("labels a below-bar draft plainly", () => {
    expect(belowBarNote(["no author advantage", "generic angle"])).toBe(
      "Below the usual bar: no author advantage; generic angle. Chosen because no stronger idea was ready for this slot."
    );
  });
});
