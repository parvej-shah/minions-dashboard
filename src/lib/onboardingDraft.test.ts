import { describe, expect, it } from "vitest";
import { INITIAL_FIELDS, parseDraft } from "./onboardingDraft";

describe("parseDraft", () => {
  it("keeps saved values of the right type", () => {
    const draft = parseDraft({ businessName: "Acme", step: 2, channels: ["linkedin", "x"], linkedInProfile: { name: "A" }, storyKind: "OPINION" });
    expect(draft).toMatchObject({ businessName: "Acme", step: 2, channels: ["linkedin", "x"], storyKind: "OPINION" });
    expect(draft.linkedInProfile).toEqual({ name: "A" });
  });

  it("accepts a preset id and a post snippet, which start as null", () => {
    expect(parseDraft({ selectedPresetId: "agency", postSnippet: "Hello" })).toEqual({ selectedPresetId: "agency", postSnippet: "Hello" });
  });

  it("drops values of the wrong type and unknown keys", () => {
    const draft = parseDraft({ businessName: 4, step: "2", channels: "linkedin", stray: "x" });
    expect(draft).toEqual({});
  });

  it("rejects publishing modes and story kinds it does not know", () => {
    expect(parseDraft({ publishingMode: "yolo", storyKind: "RANT" })).toEqual({});
  });

  it("treats anything that is not an object as an empty draft", () => {
    expect(parseDraft(null)).toEqual({});
    expect(parseDraft("draft")).toEqual({});
    expect(INITIAL_FIELDS.channels).toEqual(["linkedin"]);
  });
});
