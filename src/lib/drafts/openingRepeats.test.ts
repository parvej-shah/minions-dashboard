import { describe, expect, it } from "vitest";
import { lastParagraph, lineRepeats } from "@/lib/drafts/openingRepeats";

describe("lineRepeats (task 113 phase 3)", () => {
  it("flags the same first three words", () => {
    expect(lineRepeats("Most teams think the calendar is easy.", ["Most teams think the voice agent is the hard part."])).toMatch(/first three words/);
  });

  it("flags heavy trigram overlap", () => {
    expect(lineRepeats("A missed call after hours costs you the listing, every time.", ["Honestly, a missed call after hours costs you the listing."])).toMatch(/same words/);
  });

  it("flags a first word already used by two of the last five", () => {
    expect(lineRepeats("When a buyer calls late, nobody answers.", ["When the CRM syncs, nothing breaks.", "Agents lose leads at night.", "When the agent books, it confirms."])).toMatch(/first word/);
    expect(lineRepeats("When a buyer calls late, nobody answers.", ["When the CRM syncs, nothing breaks.", "Agents lose leads at night."])).toBeNull();
  });

  it("flags the same template with new nouns", () => {
    expect(lineRepeats("Last month a broker asked me about pricing.", ["Last week I rebuilt the intake flow."])).toMatch(/template/);
    expect(lineRepeats("Here's what changed when we moved the calendar.", ["Here is the part nobody budgets for."])).toMatch(/template/);
  });

  it("passes genuinely different lines", () => {
    const recent = ["Most teams think the voice agent is the hard part.", "Last week I rebuilt the intake flow.", "A buyer who hits voicemail rarely calls twice."];
    expect(lineRepeats("I'd check the calendar sync before anything else.", recent)).toBeNull();
    expect(lineRepeats("Which call do you lose first: the late one or the second one?", recent)).toBeNull();
  });

  it("ignores case, punctuation and empty input", () => {
    expect(lineRepeats("", ["x"])).toBeNull();
    expect(lineRepeats("Anything at all here.", [])).toBeNull();
    expect(lineRepeats("MOST TEAMS THINK, honestly.", ["most teams think it's fine"])).not.toBeNull();
  });
});

describe("lastParagraph", () => {
  it("skips the hashtag line", () => {
    expect(lastParagraph("Opening.\n\nWhat would you check first?\n\n#VoiceAI #RealEstate")).toBe("What would you check first?");
    expect(lastParagraph("Only one paragraph.")).toBe("Only one paragraph.");
  });
});
