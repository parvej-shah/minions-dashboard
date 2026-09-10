import { describe, it, expect } from "vitest";
import { toIdeaStage, isStuckDrafting, IDEA_STAGES } from "./ideaStage";

describe("toIdeaStage", () => {
  /**
   * These four are the only statuses present in the production `ideas` table
   * (REFINED 104, REVIEW 39, QUEUED 2, PICKED 1). Before this mapping the UI
   * filtered on HARVESTED/CLAIMED/DRAFTED/PUBLISHED/REJECTED, so 143 of 146
   * ideas matched no chip and every count rendered 0.
   */
  it("maps every status the pipeline actually writes", () => {
    expect(toIdeaStage("REFINED")).toBe("NEW");
    expect(toIdeaStage("REVIEW")).toBe("DRAFTED");
    expect(toIdeaStage("QUEUED")).toBe("QUEUED");
    expect(toIdeaStage("PICKED")).toBe("DRAFTING");
  });

  it("maps the legacy spellings onto the same stages", () => {
    expect(toIdeaStage("HARVESTED")).toBe("NEW");
    expect(toIdeaStage("CLAIMED")).toBe("DRAFTING");
    expect(toIdeaStage("DRAFTED")).toBe("DRAFTED");
    expect(toIdeaStage("DISCARDED")).toBe("ARCHIVED");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(toIdeaStage(" refined ")).toBe("NEW");
  });

  it("shows an unknown status rather than hiding the row", () => {
    // Hiding rows the UI did not recognize is the original defect. A future
    // pipeline state must never make an idea vanish.
    expect(toIdeaStage("SOME_FUTURE_STATE")).toBe("NEW");
    expect(toIdeaStage(null)).toBe("NEW");
    expect(toIdeaStage("")).toBe("NEW");
  });

  it("covers every stage with at least one real status", () => {
    const reached = new Set(
      ["REFINED", "QUEUED", "PICKED", "REVIEW", "PUBLISHED", "REJECTED"].map(toIdeaStage)
    );
    expect([...reached].sort()).toEqual([...IDEA_STAGES].sort());
  });
});

describe("isStuckDrafting", () => {
  /**
   * IDEA-0193 in production: claimed by run cmtvsrrpm…, no asset, because
   * n8n execution 16705 crashed in Parse Writer Output. /api/pipeline/draft
   * then refuses to re-draft a PICKED idea, so it is wedged forever.
   */
  it("flags a claimed idea that never produced an asset", () => {
    expect(isStuckDrafting("PICKED", null)).toBe(true);
  });

  it("does not flag a claim that produced an asset", () => {
    expect(isStuckDrafting("PICKED", "b4675e9d-c05f-4f2b-8348-6873894cf021")).toBe(false);
  });

  it("does not flag ideas that were never claimed", () => {
    expect(isStuckDrafting("REFINED", null)).toBe(false);
    expect(isStuckDrafting("REVIEW", null)).toBe(false);
  });
});
