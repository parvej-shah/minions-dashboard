import { describe, expect, it } from "vitest";
import { editShare } from "./editShare";

describe("editShare", () => {
  it("is 0 for untouched text, whatever the spacing", () => {
    expect(editShare("One line.\n\nTwo  lines.", "One line. Two lines.")).toBe(0);
  });

  it("is 1 for a full rewrite", () => {
    expect(editShare("alpha beta gamma", "delta epsilon")).toBe(1);
  });

  it("ignores a changed cover image line", () => {
    expect(editShare("![Cover](https://a/old.png)\n\nThe post.", "![Cover](https://a/new.png)\n\nThe post.")).toBe(0);
  });

  it("counts the share of words not kept in order", () => {
    expect(editShare("we shipped the call summary today", "we shipped the summary on friday")).toBeCloseTo(1 - 4 / 6);
  });

  it("is 0 when both are empty", () => {
    expect(editShare(null, "")).toBe(0);
  });
});
