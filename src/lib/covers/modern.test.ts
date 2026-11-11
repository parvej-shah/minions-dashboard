import { describe, expect, it } from "vitest";
import { DEFAULT_COVER_BRAND } from "./brand";
import { CoverFitError } from "./layouts";
import { BANNER_DESIGNS, bannerElement, cutoutLayout, giantWord, stickerTexts, type BannerSpec } from "./modern";
import { prepareCutout } from "./photo";
import sharp from "sharp";

// A person-shaped opaque block on a see-through page.
async function cutoutPng(opaqueBackground = false): Promise<Buffer> {
  const person = await sharp({ create: { width: 500, height: 800, channels: 4, background: { r: 40, g: 60, b: 80, alpha: 1 } } }).png().toBuffer();
  return sharp({ create: { width: 700, height: 1000, channels: 4, background: { r: 255, g: 255, b: 255, alpha: opaqueBackground ? 1 : 0 } } })
    .composite([{ input: person, left: 100, top: 200 }])
    .png()
    .toBuffer();
}

const base: Omit<BannerSpec, "design"> = {
  headline: "Your voice agent books showings your calendar never sees",
  emphasis: "never",
  kicker: "The booking only counts once it lands in the calendar.",
  label: "For real estate teams",
  seriesNo: 5,
  cutout: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", width: 600, height: 900 },
  author: { name: "Parvej Shah", role: "Builds AI voice agents" },
  brand: DEFAULT_COVER_BRAND,
};

describe("modern banner designs", () => {
  it("draws every design for a normal headline", () => {
    for (const design of BANNER_DESIGNS) expect(() => bannerElement({ ...base, design }), design).not.toThrow();
  });

  it("rejects copy that cannot fit rather than cutting it", () => {
    const headline = Array(60).fill("booking").join(" ");
    for (const design of BANNER_DESIGNS) expect(() => bannerElement({ ...base, design, headline }), design).toThrow(CoverFitError);
  });

  it("needs a kicker for the torn strip to reveal", () => {
    expect(() => bannerElement({ ...base, design: "TORN", kicker: undefined })).toThrow(CoverFitError);
  });

  it("needs a cut-out photo for the cut-out banner", () => {
    expect(() => bannerElement({ ...base, design: "CUTOUT", cutout: undefined })).toThrow(CoverFitError);
  });

  it("sets the emphasis giant behind the author, else the longest word", () => {
    expect(giantWord("Your voice agent books showings", "Showings")).toBe("showings");
    expect(giantWord("Your voice agent books showings", "two words")).toBe("showings");
    expect(giantWord("Why calendars fail", undefined)).toBe("calendars");
  });

  it("takes a real cut-out, trimmed to the person, and refuses a photo with a background", async () => {
    const ready = await prepareCutout(await cutoutPng());
    expect(ready).toMatchObject({ width: 500, height: 800 });
    expect(ready?.src).toMatch(/^data:image\/png;base64,/);
    expect(await prepareCutout(await cutoutPng(true))).toBeUndefined();
  });

  it("puts the post's own tags on the stickers when it has no label or series number", () => {
    expect(stickerTexts({ tags: ["Scope", "Price", "Proof"] })).toEqual({ top: "Scope", bottom: "Price" });
    expect(stickerTexts({ tags: ["Scope"] })).toEqual({ top: "Scope", bottom: null });
    expect(stickerTexts({})).toEqual({ top: null, bottom: null });
  });

  it("lets a label and a series number win over tags", () => {
    expect(stickerTexts({ label: "For founders", seriesNo: 5, tags: ["Scope", "Price"] })).toEqual({ top: "For founders", bottom: "No. 05" });
  });
});

describe("cutoutLayout", () => {
  // The picture the picker shows: the figure stands in front of the giant word, covering its lower part.
  const person = { width: 900, height: 1000 };
  const cases = [
    { name: "a short word, two-line headline", headlineBottom: 260, giantSize: 400 },
    { name: "a long word, three-line headline", headlineBottom: 310, giantSize: 150 },
    { name: "a four-line headline", headlineBottom: 380, giantSize: 190 },
  ];
  for (const c of cases) {
    it(`puts the head in front of the word's lower part: ${c.name}`, () => {
      const l = cutoutLayout({ ...person, ...c });
      const personTop = 1350 - l.ch;
      expect(personTop).toBeGreaterThan(l.giantTop + c.giantSize * 0.3); // the word's top stays clear
      expect(personTop).toBeLessThan(l.giantTop + c.giantSize * 0.9); // the head covers its lower part
      expect(l.giantTop).toBeGreaterThanOrEqual(c.headlineBottom - c.giantSize * 0.12); // never into the headline
      expect(l.cw).toBeLessThanOrEqual(980);
      expect(l.ch).toBeLessThanOrEqual(900);
      expect(l.ch).toBeGreaterThanOrEqual(540);
    });
  }
});
