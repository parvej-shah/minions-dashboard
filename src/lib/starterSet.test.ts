import { describe, expect, it } from "vitest";
import { pickStarterSet, STARTER_COUNT } from "@/lib/starterSet";

const idea = (id: string, laneId: string | null, gateVerdict: string | null = "PASS") => ({ id, laneId, gateVerdict });

describe("pickStarterSet", () => {
  it("asks for two extra posts", () => {
    expect(STARTER_COUNT).toBe(2);
  });

  it("takes two harvested ideas from different lanes", () => {
    const picks = pickStarterSet([idea("a", "l1"), idea("b", "l1"), idea("c", "l2")]);
    expect(picks.map((p) => (p.kind === "EXISTING" ? p.ideaId : "reframe"))).toEqual(["a", "c"]);
  });

  it("skips ideas that did not pass the gate", () => {
    const picks = pickStarterSet([idea("a", "l1", "REJECT"), idea("b", "l2", "BELOW_BAR"), idea("c", "l3")]);
    expect(picks[0]).toEqual({ kind: "EXISTING", ideaId: "c" });
    expect(picks[1].kind).toBe("REFRAME");
  });

  it("reframes the story with two different angles when nothing was harvested", () => {
    const picks = pickStarterSet([]);
    expect(picks).toHaveLength(2);
    const pillars = picks.map((p) => (p.kind === "REFRAME" ? p.angle.pillar : ""));
    expect(pillars[0]).not.toBe("");
    expect(pillars[0]).not.toBe(pillars[1]);
  });

  it("mixes one harvested idea with one reframe", () => {
    const picks = pickStarterSet([idea("a", "l1")]);
    expect(picks.map((p) => p.kind)).toEqual(["EXISTING", "REFRAME"]);
  });

  it("never returns the same idea twice", () => {
    const picks = pickStarterSet([idea("a", null), idea("a", null)]);
    expect(picks.filter((p) => p.kind === "EXISTING")).toHaveLength(1);
  });
});
