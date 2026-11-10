import { describe, expect, it } from "vitest";
import { ADVANCED_SECTIONS, BRAND_SECTIONS, resolveBrandSection } from "./brandSections";

describe("brand sections", () => {
  it("opens on the basics, also for a tab it does not know", () => {
    expect(resolveBrandSection(null)).toBe("basics");
    expect(resolveBrandSection("")).toBe("basics");
    expect(resolveBrandSection("nonsense")).toBe("basics");
  });

  it("keeps links from before the regroup working", () => {
    expect(resolveBrandSection("overview")).toBe("basics");
    expect(resolveBrandSection("experience")).toBe("experience");
    expect(resolveBrandSection("voice-proof")).toBe("voice");
    expect(resolveBrandSection("lexicon")).toBe("avoid");
    expect(resolveBrandSection("sources")).toBe("sources");
  });

  it("lists every section but the basics under Advanced, once, each with a title and one line", () => {
    const ids = ADVANCED_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(BRAND_SECTIONS.filter((s) => s !== "basics").sort());
    for (const s of ADVANCED_SECTIONS) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.line.length).toBeGreaterThan(10);
      expect(resolveBrandSection(s.id)).toBe(s.id);
    }
  });
});
