import { describe, expect, it } from "vitest";
import { SLIDE_STYLES } from "./slides";
import { STYLE_META, styleName } from "./styleNames";

describe("carousel design names", () => {
  it("names and describes every design", () => {
    for (const s of SLIDE_STYLES) {
      expect(STYLE_META[s].name.length).toBeGreaterThan(0);
      expect(STYLE_META[s].hint.length).toBeGreaterThan(0);
    }
  });
  it("falls back for plans saved before designs existed", () => {
    expect(styleName(undefined)).toBe(STYLE_META.EDITORIAL.name);
    expect(styleName("BOLD")).toBe("Bold");
  });
});
