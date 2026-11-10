import { describe, expect, it } from "vitest";
import { notesNeedLook, shouldAsk } from "./quickAsk";

describe("approval-moment ask", () => {
  it.each([
    ["OFF", false],
    ["DONE", false],
    ["NOT_YET", true],
    ["DUE", true],
    ["SNOOZED", true],
    ["CONFIRM", true],
  ])("shouldAsk(%s) is %s", (state, want) => {
    expect(shouldAsk(state as never)).toBe(want);
  });

  it("sends flagged notes to the full editor", () => {
    const ok = { check: null };
    expect(notesNeedLook([ok as never])).toBe(false);
    expect(notesNeedLook([{ check: { confidential: true, issues: [] } } as never])).toBe(true);
    expect(notesNeedLook([{ check: { confidential: false, issues: [{ text: "x", reason: "y" }] } } as never])).toBe(true);
  });
});
