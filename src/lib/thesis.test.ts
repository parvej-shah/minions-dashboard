import { describe, it, expect } from "vitest";
import { thesisKey, tokenOverlap, isRedundantThesis, normalizeTokens } from "./thesis";

describe("normalizeTokens", () => {
  it("drops stopwords, filler, and short words", () => {
    expect(normalizeTokens("The best strategy for your business")).toEqual([]);
  });

  it("keeps distinctive terms, stemmed to a common form", () => {
    expect(normalizeTokens("HVAC dispatch software overspending")).toEqual([
      "hvac",
      "dispatch",
      "softwar",
      "overspend",
    ]);
  });

  it("collapses morphological variants so paraphrases match", () => {
    expect(normalizeTokens("regulations reshapes")).toEqual(normalizeTokens("regulation reshape"));
  });
});

describe("thesisKey", () => {
  it("is order-independent", () => {
    const a = thesisKey("Most HVAC firms overspend on dispatch software");
    const b = thesisKey("Dispatch software is where HVAC firms overspend");
    expect(a).toBe(b);
  });

  it("distinguishes genuinely different claims", () => {
    const a = thesisKey("HVAC firms overspend on dispatch software");
    const b = thesisKey("Plumbing apprenticeships collapse without mentorship");
    expect(a).not.toBe(b);
  });

  it("returns empty string when nothing distinctive survives", () => {
    expect(thesisKey("the best tips for your business")).toBe("");
  });
});

describe("tokenOverlap", () => {
  it("is 1 for identical sets and 0 for disjoint", () => {
    expect(tokenOverlap(["a", "b"], ["b", "a"])).toBe(1);
    expect(tokenOverlap(["a"], ["b"])).toBe(0);
  });

  it("is 0 when either side is empty", () => {
    expect(tokenOverlap([], ["a"])).toBe(0);
  });
});

describe("isRedundantThesis", () => {
  const existing = [
    { rawIdea: "Most HVAC firms overspend on dispatch software", angle: null, thesisKey: null },
  ];

  it("catches a reworded restatement", () => {
    expect(
      isRedundantThesis(
        { rawIdea: "Dispatch software is where HVAC firms overspend", angle: null },
        existing
      )
    ).toBe(true);
  });

  it("catches a paraphrase that only changes word forms", () => {
    const backlog = [
      { rawIdea: "Refrigerant rules reshape retrofit timelines", angle: null, thesisKey: null },
    ];
    expect(
      isRedundantThesis(
        { rawIdea: "Refrigerant regulations reshaped retrofit timelines", angle: null },
        backlog
      )
    ).toBe(true);
  });

  it("allows a genuinely new claim", () => {
    expect(
      isRedundantThesis(
        { rawIdea: "Refrigerant regulation reshapes retrofit timelines", angle: null },
        existing
      )
    ).toBe(false);
  });

  it("does not flag an idea with no distinctive tokens", () => {
    expect(isRedundantThesis({ rawIdea: "the best tips", angle: null }, existing)).toBe(false);
  });

  it("prefers a stored thesisKey over recomputing", () => {
    const stored = [{ thesisKey: "dispatch-firm-hvac-overspend-softwar", rawIdea: null, angle: null }];
    expect(
      isRedundantThesis({ rawIdea: "HVAC firms overspend on dispatch software", angle: null }, stored)
    ).toBe(true);
  });
});
