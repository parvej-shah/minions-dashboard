import { describe, expect, it } from "vitest";
import { artSvg, chooseArt, MOTIFS, parseArtStyle, type ArtChoice } from "./art";
import { DOODLES, type DoodleName } from "./doodles";
import { DEFAULT_COVER_BRAND } from "./brand";
import { coverElement, CoverFitError, type CoverSpec } from "./layouts";
import { renderCoverPng } from "./render";

const colours = { main: "#0e5c63", highlight: "#ff6b4a", bg: "#fff8f0", ink: "#12242a" };
const VOICE = "A single voice agent can't qualify a lead and keep the call natural";

describe("the illustration is chosen in code", () => {
  it("follows the post's words", () => {
    expect(chooseArt("SHAPES", VOICE, "a")).toMatchObject({ motif: "WAVEFORM", by_keyword: true });
    expect(chooseArt("SHAPES", "Automate the confirmation call first, not the whole dispatch flow", "a")?.motif).toBe("FLOW");
    expect(chooseArt("DOODLES", "We shipped the launch a week early", "a")?.motif).toBe("UNBOXING");
  });

  it("is the same for the same post, and none for NONE", () => {
    expect(chooseArt("SHAPES", "Plain words here", "asset-1")).toEqual(chooseArt("SHAPES", "Plain words here", "asset-1"));
    expect(chooseArt("NONE", VOICE, "a")).toBeNull();
  });

  it("does not repeat the last two covers' motif, and never returns the one a reviewer replaced", () => {
    const next = chooseArt("SHAPES", VOICE, "a", ["WAVEFORM"]);
    expect(next?.motif).not.toBe("WAVEFORM");
    expect(next).toMatchObject({ motif: "FUNNEL", by_keyword: true }); // "lead", "qualify": the next match
    for (let i = 0; i < 20; i++) expect(chooseArt("SHAPES", "Plain words", `s${i}`, [], "GRID")?.motif).not.toBe("GRID");
    const rotated = chooseArt("SHAPES", "Plain words", "s", ["BARS", "FORK", "GRID"]);
    expect(rotated?.by_keyword).toBe(false);
    expect(["BARS", "FORK", "GRID"]).not.toContain(rotated?.motif);
  });

  it("accepts only the three styles", () => {
    expect(parseArtStyle("DOODLES")).toBe("DOODLES");
    expect(parseArtStyle("CLIPART")).toBeNull();
    expect(parseArtStyle(undefined)).toBeNull();
  });
});

describe("every illustration draws in the brand's colours", () => {
  const all: ArtChoice[] = [
    ...MOTIFS.map((motif) => ({ style: "SHAPES" as const, motif })),
    ...(Object.keys(DOODLES) as DoodleName[]).map((motif) => ({ style: "DOODLES" as const, motif })),
  ];

  it.each(all.map((c) => [c.motif, c] as const))("%s", (_, choice) => {
    const { svg, aspect } = artSvg(choice, "seed", colours);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).not.toMatch(/__INK__|__ACCENT__|NaN|undefined/);
    // A repeated attribute makes the whole SVG invalid, and the cover shows no picture at all.
    for (const tag of svg.match(/<[a-z]+\s[^>]*>/g) ?? []) {
      const names = [...tag.matchAll(/\s([a-z-]+)="/g)].map((m) => m[1]);
      expect(new Set(names).size, tag.slice(0, 80)).toBe(names.length);
    }
    expect(svg).toContain(colours.highlight);
    expect(aspect).toBeGreaterThan(0.5);
    expect(artSvg(choice, "seed", colours).svg).toBe(svg);
  });

  it("renders on a real cover", async () => {
    const spec: CoverSpec = { layout: "HEADLINE", headline: "Short claim here", author: { name: "Test" }, brand: DEFAULT_COVER_BRAND };
    for (const choice of [all[0], all[all.length - 1]]) {
      const png = await renderCoverPng({ ...spec, art: { choice, seed: "x" } });
      expect(png.subarray(1, 4).toString()).toBe("PNG");
    }
  });
});

describe("the illustration never costs the headline its size", () => {
  const brand = DEFAULT_COVER_BRAND;
  const long = "Your voice agent confirms every booking on the call but half of them never reach the calendar because the webhook times out silently";
  const art = { choice: { style: "SHAPES" as const, motif: "WAVEFORM" as const }, seed: "x" };

  it("refuses a cover whose headline would be set too small with it, and fits without it", () => {
    const spec: CoverSpec = { layout: "HEADLINE", headline: long, kicker: "One line under it says what the reader gets.", author: { name: "Test" }, brand };
    expect(() => coverElement({ ...spec, art })).toThrow(CoverFitError);
    expect(() => coverElement(spec)).not.toThrow();
  });

  it("is ignored by QUOTE and NUMBER covers", () => {
    const spec: CoverSpec = { layout: "NUMBER", headline: "Jobs won by the first response", number: { value: "78", unit: "percent" }, author: { name: "Test" }, brand };
    expect(() => coverElement({ ...spec, art })).not.toThrow();
  });
});
