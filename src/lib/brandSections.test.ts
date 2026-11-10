import { describe, expect, it } from "vitest";
import { ADVANCED_SECTIONS, BRAND_SECTIONS, SECTION_PAGES, resolveBrandSection } from "./brandSections";

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

  it("gives every section but the basics its own page, once, each with a title and one line", () => {
    const ids = SECTION_PAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(BRAND_SECTIONS.filter((s) => s !== "basics").sort());
    for (const s of SECTION_PAGES) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.line.length).toBeGreaterThan(10);
      expect(resolveBrandSection(s.id)).toBe(s.id);
    }
  });

  it("keeps cover look out of Advanced: it is a basic, edited in full on its own page", () => {
    expect(ADVANCED_SECTIONS.map((s) => s.id)).not.toContain("cover");
    expect(SECTION_PAGES.find((s) => s.id === "cover")?.advanced).toBe(false);
    expect(ADVANCED_SECTIONS.every((s) => s.advanced)).toBe(true);
  });
});
