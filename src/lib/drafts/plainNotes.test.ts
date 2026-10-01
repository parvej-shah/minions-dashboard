import { describe, expect, it } from "vitest";
import { plainNote, plainReviewNotes } from "./plainNotes";

describe("plainNote", () => {
  it("rewrites invented figures as a fix", () => {
    expect(plainNote("States figures found in no input: 40%, 3x.")).toEqual({
      tone: "fix",
      text: "These numbers didn't come from you: 40%, 3x. Remove them, or keep them if they're right.",
    });
  });

  it("rewrites an unbacked claim as a check", () => {
    expect(plainNote('Unbacked statistic: "Most teams waste 30% of sprints"')).toEqual({
      tone: "check",
      text: 'Make sure this is true: "Most teams waste 30% of sprints"',
    });
  });

  it("explains a below-bar draft in plain words", () => {
    const note = plainNote("Below the usual bar: no author advantage. Chosen because no stronger idea was ready for this slot.");
    expect(note.tone).toBe("fix");
    expect(note.text).toContain("no author advantage");
    expect(note.text).toContain("Add a real example");
  });

  it("keeps readability notes as tips, with singular wording", () => {
    expect(plainNote("1 paragraph(s) run over 3 sentences.")).toEqual({
      tone: "tip",
      text: "1 paragraph is long for a phone screen. Break it up.",
    });
  });

  it("passes unknown notes through as a check", () => {
    expect(plainNote("Something new")).toEqual({ tone: "check", text: "Something new" });
  });
});

describe("plainReviewNotes", () => {
  it("orders fixes before checks before tips", () => {
    const notes = plainReviewNotes({
      claims_ok: "Y",
      review_notes: ["2 sentence(s) run over 25 words.", 'States a count no item gives: "12 clients".', "Uses banned words: synergy"],
    });
    expect(notes.map((n) => n.tone)).toEqual(["fix", "check", "tip"]);
  });

  it("flags unapproved facts when no note explains them", () => {
    const notes = plainReviewNotes({ claims_ok: "BLOCKED_PENDING_REVIEW", review_notes: [] });
    expect(notes).toEqual([{ tone: "check", text: "Some facts in this post need your OK before it goes out." }]);
  });

  it("is empty for a clean, approved draft", () => {
    expect(plainReviewNotes({ claims_ok: "Y", review_notes: [] })).toEqual([]);
  });
});
