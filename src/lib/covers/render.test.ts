import { describe, expect, it } from "vitest";
import { coverBrand } from "./brand";
import { ICONS, type IconName } from "./icons";
import { COVER_LAYOUTS, type CoverSpec } from "./layouts";
import { needsFallbackGlyphs, renderCoverSvg } from "./render";

const icon = Object.keys(ICONS)[0] as IconName;
const spec = {
  layout: "HEADLINE",
  label: "For real estate teams",
  headline: "Ask for the schema, not the demo",
  emphasis: "schema",
  kicker: "A booked showing only exists when your systems confirm it.",
  author: { name: "Parvej Shah", role: "Founder of Minions.AI" },
  brand: coverBrand({}).brand,
  quote: "A booking only exists when your calendar confirms it.",
  number: { value: "3", unit: "seconds" },
  list: ["Answer every call", "Book the showing", "Confirm in the calendar"],
  grid: ["Calls", "Leads", "Showings", "Offers"].map((label) => ({ label, icon })),
  punch: { lines: ["Calls ring out.", "Leads go cold.", "Showings slip."], checks: ["Answered", "Booked", "Confirmed"] },
} as CoverSpec;

describe("the cover as a vector picture (layout picker tiles)", () => {
  it("is an SVG the size of the cover, with the text drawn as shapes", async () => {
    const svg = await renderCoverSvg(spec);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="1080"');
    expect(svg).toContain('height="1350"');
    expect(svg).toContain("<path");
    expect(svg).not.toMatch(/<script/i);
  });

  // A speed limit is wall-clock time, which the parallel suite skews; run alone: COVER_BENCH=1 npx vitest run src/lib/covers/render.test.ts
  it.runIf(process.env.COVER_BENCH === "1")("draws every layout in under 100 ms once warm (best of 5)", async () => {
    await renderCoverSvg(spec);
    const slow: string[] = [];
    for (const layout of COVER_LAYOUTS.filter((l) => l !== "PHOTO" && l !== "CUTOUT")) {
      const times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t = performance.now();
        await renderCoverSvg({ ...spec, layout });
        times.push(performance.now() - t);
      }
      const best = Math.min(...times);
      console.log(`${layout.padEnd(10)} ${best.toFixed(0)} ms`);
      if (best >= 100) slow.push(`${layout} ${best.toFixed(0)}ms`);
    }
    expect(slow).toEqual([]);
  }, 60_000);

  it("knows when the text needs letters our fonts do not have", () => {
    expect(needsFallbackGlyphs(spec)).toBe(false);
    expect(needsFallbackGlyphs({ ...spec, headline: "Don’t lose the lead — “ever” … 50%" })).toBe(false);
    expect(needsFallbackGlyphs({ ...spec, headline: "বাংলা শিরোনাম" })).toBe(true);
    expect(needsFallbackGlyphs({ ...spec, kicker: "Booked 🎉" })).toBe(true);
  });
});
