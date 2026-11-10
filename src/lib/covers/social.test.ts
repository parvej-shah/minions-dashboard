import { describe, expect, it } from "vitest";
import { DEFAULT_COVER_BRAND } from "./brand";
import { BANNER_DESIGNS, bannerElement, type BannerSpec } from "./modern";
import { SOCIAL_DESIGNS, tagsFor } from "./social";
import { renderCoverPng } from "./render";

const base: Omit<BannerSpec, "design"> = {
  headline: "Missed calls are booked tours you never see",
  emphasis: "booked",
  kicker: "What a 24/7 voice line changes for a small brokerage",
  label: "For real estate teams",
  author: { name: "Parvej Shah", role: "Founder" },
  brand: DEFAULT_COVER_BRAND,
};

describe("social poster designs", () => {
  it("are ten, and every one is a cover design", () => {
    expect(SOCIAL_DESIGNS).toHaveLength(10);
    for (const d of SOCIAL_DESIGNS) expect(BANNER_DESIGNS).toContain(d);
  });

  it("tags come only from the post's own short grid or list items, at most three", () => {
    expect(tagsFor([{ label: "Strategy first" }, { label: "Design with meaning" }, { label: "Built to scale" }, { label: "Ship" }], undefined)).toEqual(["Strategy first", "Design with meaning", "Built to scale"]);
    expect(tagsFor(undefined, ["Answer every call", "A sentence far too long to sit on a small sticker tag"])).toEqual(["Answer every call"]);
    expect(tagsFor(undefined, undefined)).toEqual([]);
  });

  it("draws Tagged with and without tags, and Magazine with and without a cut-out", () => {
    expect(() => bannerElement({ ...base, design: "TAGGED", tags: ["Strategy first", "Built to scale"] })).not.toThrow();
    expect(() => bannerElement({ ...base, design: "TAGGED" })).not.toThrow();
    expect(() => bannerElement({ ...base, design: "MAGAZINE" })).not.toThrow();
  });

  it("renders each design to a PNG through the cover renderer", async () => {
    for (const layout of SOCIAL_DESIGNS) {
      const png = await renderCoverPng({ layout, headline: base.headline, emphasis: base.emphasis, kicker: base.kicker, label: base.label, author: base.author, brand: base.brand });
      expect(png.subarray(1, 4).toString(), layout).toBe("PNG");
    }
  }, 60_000);
});
