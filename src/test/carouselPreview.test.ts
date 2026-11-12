import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");
const studio = read("src/components/editorial/EditorialStudio.tsx");
const tabs = read("src/components/editorial/social/SocialVariantTabs.tsx");

describe("carousel in the channel preview", () => {
  it("keeps the LinkedIn tab when the carousel is on", () => {
    expect(studio).not.toMatch(/LINKEDIN: enabledSocialTabs\.LINKEDIN && !linkedinGetsCarousel/);
    expect(studio).toMatch(/linkedinCarousel=/);
  });

  it("shows the carousel's text in the LinkedIn tab with its configuration note", () => {
    expect(tabs).toMatch(/linkedinCarousel/);
    expect(tabs).toMatch(/carousel configured above/);
  });

  it("has a one-tap Copy in the LinkedIn tab for the post text", () => {
    expect(tabs).toMatch(/VariantActions/);
    expect(tabs).toMatch(/onCopy/);
  });

  it("lets Instagram save every page", () => {
    expect(tabs).toMatch(/Save all \$\{deck\.length\} pages|Save all/);
    expect(tabs).toMatch(/onSavePages/);
    expect(studio).toMatch(/savePages\(/);
  });
});
