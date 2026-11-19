import { describe, expect, it } from "vitest";
import { coverBrand } from "./brand";
import { COVER_FONTS, COVER_FONT_IDS, FONT_FAMILIES, activeCoverFont, faceStyle, metricsFor, readCoverFont, satoriFonts, withCoverFont } from "./fonts";
import { FONTS } from "./custom/contract";
import { COVER_LAYOUTS, type CoverSpec } from "./layouts";
import { renderCoverSvg } from "./render";

const spec = {
  layout: "HEADLINE",
  headline: "Ask for the schema, not the demo",
  emphasis: "schema",
  kicker: "A booked showing only exists when your systems confirm it.",
  author: { name: "Parvej Shah", role: "Founder of Minions.AI" },
  brand: coverBrand({}).brand,
} as CoverSpec;

describe("cover fonts (task 97)", () => {
  it("every font loads, measures Latin letters and draws a cover", async () => {
    for (const id of COVER_FONT_IDS) {
      await withCoverFont(id, async () => {
        expect(faceStyle("serif").fontFamily).toBe(COVER_FONTS[id].name);
        const m = metricsFor("serif");
        for (const ch of "Aaé1.?") expect(m.advance(ch.codePointAt(0)!)).toBeGreaterThan(0);
        expect(satoriFonts().map((f) => f.name)).toContain(COVER_FONTS[id].name);
      });
      const svg = await renderCoverSvg({ ...spec, font: id });
      expect(svg).toContain("<path");
    }
  });

  it("draws every built-in layout in the widest font", async () => {
    for (const layout of COVER_LAYOUTS.filter((l) => !["PHOTO", "CUTOUT", "LIST", "GRID", "PUNCH", "NUMBER", "QUOTE"].includes(l))) {
      await expect(renderCoverSvg({ ...spec, layout, font: "unbounded" })).resolves.toContain("<svg");
    }
  });

  it("keeps the font to its own render, even when two run at once", async () => {
    const seen: string[] = [];
    await Promise.all(
      (["anton", "syne"] as const).map((id) =>
        withCoverFont(id, async () => {
          await new Promise((r) => setTimeout(r, id === "anton" ? 20 : 0));
          seen.push(`${id}:${activeCoverFont()}`);
        })
      )
    );
    expect(seen.sort()).toEqual(["anton:anton", "syne:syne"]);
    expect(activeCoverFont()).toBe("bricolage");
  });

  it("falls back to Bricolage for an unknown or missing font", () => {
    expect(withCoverFont("comic", () => faceStyle("serif").fontFamily)).toBe("Bricolage Grotesque");
    expect(readCoverFont({ cover_font: "nope" })).toBe("bricolage");
    expect(readCoverFont(null)).toBe("bricolage");
    expect(readCoverFont({ cover_font: "anton" })).toBe("anton");
  });

  it("the body face never changes with the cover font", () => {
    expect(withCoverFont("dmserif", () => faceStyle("sans").fontFamily)).toBe("Plus Jakarta Sans");
  });

  it("custom designs may name exactly the bundled fonts", () => {
    expect([...FONTS].sort()).toEqual([...FONT_FAMILIES].sort());
    expect(satoriFonts(true).map((f) => f.name)).toEqual(expect.arrayContaining(FONT_FAMILIES));
  });
});
