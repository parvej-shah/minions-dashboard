import { describe, expect, it } from "vitest";
import { overstatedVerbs, unsupportedSpelledFigures } from "./claimWords";

describe("overstatedVerbs", () => {
  it("catches a verb the source never uses (a real import item, 2026-10-21)", () => {
    const site = "Hear it for yourself. Call our live demo line and ask Rex about a 2-bedroom in Dubai Marina.";
    expect(overstatedVerbs("I engineered a demo where the AI qualified a buyer.", site)).toEqual(["I engineered"]);
  });

  it("accepts the verb in any form the source uses", () => {
    expect(overstatedVerbs("I built a reconciliation engine.", "Built a reconciliation engine that matches bank transactions.")).toEqual([]);
    expect(overstatedVerbs("I led the first external audit.", "Led the first external audit with zero material findings.")).toEqual([]);
    expect(overstatedVerbs("I founded LedgerLoop.", "Founder at LedgerLoop")).toEqual([]);
    expect(overstatedVerbs("We've personally designed it.", "Our designers did it.")).toEqual([]);
  });

  it("catches the same claim in the present tense, but not plain service verbs", () => {
    const site = "Our four-step process gets your AI crew answering calls. We integrate with Follow Up Boss.";
    expect(overstatedVerbs("I engineer AI crews and we lead every launch.", site)).toEqual(["I engineer", "we lead"]);
    expect(overstatedVerbs("I build AI crews.", "We build AI crews.")).toEqual([]);
    expect(overstatedVerbs("I deliver AI phone agents through a four-step process.", site)).toEqual([]);
  });

  it("leaves helping, third persons and idioms alone", () => {
    expect(overstatedVerbs("I helped design the flow. The team built it. I ran into the same wall.", "I helped.")).toEqual([]);
  });
});

describe("unsupportedSpelledFigures", () => {
  // From the first post written on 2026-10-21: the profile never says seven.
  const profile = "A close that should take three days drags on for ten. Customers cut their close from 10 days to 4 days. I spent six years as a controller.";

  it("catches a counted unit the source never states", () => {
    expect(unsupportedSpelledFigures("By day seven, people are too drained to spot the ones that do.", profile)).toEqual(["day seven"]);
    expect(unsupportedSpelledFigures("Three weeks later the team gave up.", profile)).toEqual(["Three weeks"]);
  });

  it("matches a figure the source states in digits or words", () => {
    expect(unsupportedSpelledFigures("I spent six years as a controller. Ten days became four days.", profile)).toEqual([]);
  });

  it("leaves structure alone", () => {
    expect(unsupportedSpelledFigures("Two things matter here, and three steps fix it.", profile)).toEqual([]);
  });
});
