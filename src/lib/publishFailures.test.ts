import { describe, expect, it } from "vitest";
import { failureList, failureSummary } from "./publishFailures";

describe("publish failures", () => {
  it("lists each failed channel with its name and reason, in a fixed order", () => {
    expect(failureList({ instagram: "no permission", linkedin: "The token used in the request has expired" })).toEqual([
      { channel: "linkedin", label: "LinkedIn", reason: "The token used in the request has expired" },
      { channel: "instagram", label: "Instagram", reason: "no permission" },
    ]);
  });

  it("ignores junk: null, arrays, unknown channels, empty reasons", () => {
    expect(failureList(null)).toEqual([]);
    expect(failureList([])).toEqual([]);
    expect(failureList({ telegram: "x", linkedin: "", facebook: 3 })).toEqual([]);
  });

  it("sums up in plain words", () => {
    expect(failureSummary(null)).toBeNull();
    expect(failureSummary({ linkedin: "x" })).toBe("LinkedIn failed");
    expect(failureSummary({ linkedin: "x", instagram: "y" })).toBe("LinkedIn and Instagram failed");
    expect(failureSummary({ linkedin: "x", facebook: "y", instagram: "z" })).toBe("LinkedIn, Facebook and Instagram failed");
  });
});
