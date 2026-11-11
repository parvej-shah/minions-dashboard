import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");
const studio = read("src/components/editorial/EditorialStudio.tsx");
const card = read("src/components/editorial/CarouselCard.tsx");
const tabs = read("src/components/editorial/social/SocialVariantTabs.tsx");

describe("carousel in the channel preview", () => {
  it("keeps the LinkedIn tab when the carousel is on", () => {
    expect(studio).not.toMatch(/LINKEDIN: enabledSocialTabs\.LINKEDIN && !linkedinGetsCarousel/);
    expect(studio).toMatch(/linkedinCarousel=/);
  });

  it("shows the carousel's text and pages in the LinkedIn tab", () => {
    expect(tabs).toMatch(/linkedinCarousel/);
    expect(tabs).toMatch(/instead of the cover/);
  });

  it("has a one-tap Copy on the carousel's post text", () => {
    expect(card).toMatch(/Copy post text/);
    expect(card).toMatch(/onCopy\(carousel\.caption/);
  });

  it("lets Instagram save every page", () => {
    expect(tabs).toMatch(/Save all \$\{deck\.length\} pages|Save all/);
    expect(tabs).toMatch(/onSavePages/);
    expect(studio).toMatch(/savePages\(/);
  });
});
