import { describe, it, expect } from "vitest";
import {
  WRITER_EXPERTISE_OPTIONS,
  DEFAULT_WRITER_EXPERTISE,
  resolveWriterExpertise,
  writerExpertisePromptGuidance,
} from "./writerExpertise";

describe("writer expertise", () => {
  it("defaults to PRACTITIONER", () => {
    expect(DEFAULT_WRITER_EXPERTISE).toBe("PRACTITIONER");
    expect(WRITER_EXPERTISE_OPTIONS.map((o) => o.id)).toEqual([
      "EXPLORER",
      "PRACTITIONER",
      "AUTHORITY",
    ]);
  });

  /**
   * The old reader-facing enum was PRACTITIONER | OPERATOR | EXECUTIVE. Two of
   * those are gone, but PRACTITIONER is spelled the same in both and means
   * something different now, so a stale stored value stays "valid" and is
   * silently reinterpreted. The SQL migration rewrites every row for exactly
   * this reason; this pins the two values that MUST fall back so a
   * half-applied migration surfaces as the default rather than a type error.
   */
  it("falls back for retired reader levels", () => {
    expect(resolveWriterExpertise("OPERATOR")).toBe("PRACTITIONER");
    expect(resolveWriterExpertise("EXECUTIVE")).toBe("PRACTITIONER");
    expect(resolveWriterExpertise(undefined)).toBe("PRACTITIONER");
    expect(resolveWriterExpertise("nonsense")).toBe("PRACTITIONER");
  });

  it("keeps valid author levels", () => {
    expect(resolveWriterExpertise("EXPLORER")).toBe("EXPLORER");
    expect(resolveWriterExpertise("AUTHORITY")).toBe("AUTHORITY");
  });

  /**
   * The whole point of the re-point: this axis governs EVIDENCE, not reading
   * level. If guidance starts telling the model how technical to be, it is
   * back to fighting the audience directives -- the exact conflict removed
   * from the onboarding preset lanes.
   */
  it("constrains evidence without dictating reading level", () => {
    const explorer = writerExpertisePromptGuidance("EXPLORER");
    expect(explorer).toMatch(/audience directives alone decide how technical/i);
    expect(explorer).toMatch(/never write a sentence that implies years of experience/i);

    // No level may instruct the model to simplify or deepen the prose itself.
    for (const option of WRITER_EXPERTISE_OPTIONS) {
      expect(option.promptGuidance).not.toMatch(/define common terms|avoid jargon entirely/i);
    }
  });

  it("forbids fabricated specifics at every level", () => {
    for (const option of WRITER_EXPERTISE_OPTIONS) {
      expect(option.promptGuidance).toMatch(/never (invent|fabricate)/i);
    }
  });
});
