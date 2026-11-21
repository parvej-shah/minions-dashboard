import { describe, expect, it } from "vitest";
import { hookFor } from "@/lib/drafts/strategy";
import { pickStarterSet, STARTER_COUNT, STARTER_ROLES } from "@/lib/starterSet";

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

  it("gives the story two different jobs when nothing was harvested", () => {
    const picks = pickStarterSet([], "PAST_EXPERIENCE");
    expect(picks.map((p) => (p.kind === "REFRAME" ? p.role.id : ""))).toEqual(["lesson", "reader"]);
  });

  // The bug: all three first posts opened on the same scene from the story.
  it.each(["PAST_EXPERIENCE", "PROFESSIONAL_OPINION", "ICP_QUESTION", "CURRENT_WORK", null])(
    "the three first posts open three different ways (story source %s)",
    (first) => {
      const reframes = pickStarterSet([], first).filter((p) => p.kind === "REFRAME");
      const openings = [first, ...reframes.map((p) => p.sourceType)].map((t) => hookFor({ sourceType: t }).archetype);
      expect(new Set(openings).size).toBe(3);
    }
  );

  it("a lived story's lesson post argues a view, not the same scene", () => {
    const [lesson] = pickStarterSet([], "PAST_EXPERIENCE");
    expect(lesson.kind === "REFRAME" && hookFor({ sourceType: lesson.sourceType }).archetype).toBe("POSITION");
  });

  it("only the reader's-side post leaves the story out, and every brief says not to retell it", () => {
    expect(STARTER_ROLES.map((r) => [r.id, r.keepsStory])).toEqual([["lesson", true], ["reader", false]]);
    for (const role of STARTER_ROLES) expect(role.brief).toMatch(/Do not retell/);
  });

  it("a harvested idea takes a slot and the reframe gets an opening the story does not use", () => {
    const picks = pickStarterSet([idea("a", "l1")], "PROFESSIONAL_OPINION");
    expect(picks[1].kind === "REFRAME" && hookFor({ sourceType: picks[1].sourceType }).archetype).not.toBe("POSITION");
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
