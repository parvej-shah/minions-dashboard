import { describe, it, expect } from "vitest";
import { verbatimGuard } from "./craftExtract";

const SOURCE =
  "Most HVAC contractors believe that dispatch software pays for itself within a single quarter, " +
  "but the real payback period is closer to eighteen months once training time is counted.";

describe("verbatimGuard", () => {
  it("strips a long literal run lifted from the source", () => {
    const notes =
      "The piece opens with a claim. Most HVAC contractors believe that dispatch software pays for itself within a single quarter. Then it pivots.";
    const guarded = verbatimGuard(notes, SOURCE);
    expect(guarded).toContain("[…]");
    expect(guarded).not.toContain("dispatch software pays for itself within a single quarter");
  });

  it("keeps genuine structural description", () => {
    const notes =
      "Opens by naming a widely held belief, then undercuts it with a cost figure. Closes on a decision rule.";
    expect(verbatimGuard(notes, SOURCE)).toBe(notes);
  });

  it("keeps short overlapping phrases that are unavoidable", () => {
    const notes = "It mentions HVAC contractors early.";
    expect(verbatimGuard(notes, SOURCE)).toBe(notes);
  });

  it("is punctuation- and case-insensitive when matching", () => {
    const notes = "It says: MOST HVAC CONTRACTORS BELIEVE THAT DISPATCH SOFTWARE PAYS FOR ITSELF within a single quarter!";
    expect(verbatimGuard(notes, SOURCE)).toContain("[…]");
  });

  it("returns notes unchanged when there is no source text", () => {
    expect(verbatimGuard("Some notes.", "")).toBe("Some notes.");
  });

  it("collapses consecutive redactions", () => {
    const notes =
      "Most HVAC contractors believe that dispatch software pays for itself within a single quarter. " +
      "The real payback period is closer to eighteen months once training time is counted.";
    const guarded = verbatimGuard(notes, SOURCE);
    expect(guarded.match(/\[…\]/g)?.length).toBe(1);
  });
});
