import { describe, expect, it } from "vitest";
import { DEFAULT_COVER_BRAND } from "./brand";
import { CoverFitError } from "./layouts";
import { BANNER_DESIGNS, bannerElement, type BannerSpec } from "./modern";

const base: Omit<BannerSpec, "design"> = {
  headline: "Your voice agent books showings your calendar never sees",
  emphasis: "never",
  kicker: "The booking only counts once it lands in the calendar.",
  label: "For real estate teams",
  seriesNo: 5,
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
});
