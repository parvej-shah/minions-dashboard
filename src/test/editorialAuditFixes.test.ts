import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Editorial Studio UX Audit Fixes (Task 61)", () => {
  const reviewDecision = read("src/components/editorial/ReviewDecision.tsx");
  const coverCard = read("src/components/editorial/CoverImageCard.tsx");
  const draftChecks = read("src/components/editorial/DraftChecks.tsx");
  const markdownArticle = read("src/components/editorial/MarkdownArticle.tsx");
  const editorialStudio = read("src/components/editorial/EditorialStudio.tsx");

  it("suppresses the scolding compliance check warning in ReviewDecision", () => {
    // No yellow banner scolding the user about unchecked facts
    expect(reviewDecision).not.toContain("facts aren't checked yet");
    expect(reviewDecision).not.toContain("Open Details below and mark");
  });

  it("removes ambiguous 'Edit text' button from the sidebar", () => {
    // Edits must be contextual on cards, not an ambiguous 'Edit text' in the sidebar
    expect(reviewDecision).not.toContain(">Edit text<");
    expect(reviewDecision).not.toContain("Edit text\n");
  });

  it("removes internal AI self-justification 'Why this wording' from CoverImageCard", () => {
    expect(coverCard).not.toContain("Why this wording");
  });

  it("filters out subjective grammar nagging from DraftChecks", () => {
    expect(draftChecks).not.toContain("Shorter ones read faster");
  });

  it("removes side-tab thick borders from MarkdownArticle", () => {
    expect(markdownArticle).not.toContain("border-l-4");
    expect(markdownArticle).not.toContain("border-l-2");
  });

  it("defaults Details accordion in EditorialStudio to closed", () => {
    // detailsOpen must not be forced open based on seriousNotes + unchecked > 0
    expect(editorialStudio).not.toMatch(/detailsOpen=\{seriousNotes \+ unchecked > 0\}/);
    expect(editorialStudio).toMatch(/detailsOpen=\{false\}/);
  });
});
