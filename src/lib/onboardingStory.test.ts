import { describe, expect, it } from "vitest";
import { composeStory, restoreStory, setupStep } from "./onboardingStory";

const picks = [
  { id: "a", kind: "CURRENT_WORK" as const, content: "This month we're teaching the voice agent to book viewings." },
  { id: "b", kind: "PAST_EXPERIENCE" as const, content: "Most missed leads call between 7 p.m. and 9 a.m." },
];

describe("composeStory", () => {
  it("uses the picked item's own kind and text", () => {
    expect(composeStory(picks[0], "")).toEqual({ storyText: picks[0].content, storyKind: "CURRENT_WORK" });
  });

  it("adds the optional detail under the picked item", () => {
    expect(composeStory(picks[1], "  We lost three deals that way.  ")).toEqual({
      storyText: `${picks[1].content}\n\nWe lost three deals that way.`,
      storyKind: "PAST_EXPERIENCE",
    });
  });

  it("treats anything typed without a pick as a lesson", () => {
    expect(composeStory(null, "We cut onboarding to three steps.")).toEqual({
      storyText: "We cut onboarding to three steps.",
      storyKind: "LESSON",
    });
  });
});

describe("restoreStory", () => {
  it("finds the pick and the detail in a saved story", () => {
    expect(restoreStory(`${picks[1].content}\n\nWe lost three deals.`, picks)).toEqual({ pickId: "b", detail: "We lost three deals." });
  });

  it("starts on the first pick when nothing is written yet", () => {
    expect(restoreStory("", picks)).toEqual({ pickId: "a", detail: "" });
  });

  it("restores own writing as 'Something else'", () => {
    expect(restoreStory("My own story.", picks)).toEqual({ pickId: null, detail: "My own story." });
    expect(restoreStory("", [])).toEqual({ pickId: null, detail: "" });
  });

  it("round-trips with composeStory", () => {
    const { storyText } = composeStory(picks[0], "A detail.");
    expect(restoreStory(storyText, picks)).toEqual({ pickId: "a", detail: "A detail." });
  });
});

describe("setupStep", () => {
  it("counts the four setup steps on both paths", () => {
    expect(["import", "reading", "review", "story"].map(setupStep)).toEqual([1, 2, 3, 4]);
    expect(["import", "focus", "audience", "story"].map(setupStep)).toEqual([1, 2, 3, 4]);
  });
});
