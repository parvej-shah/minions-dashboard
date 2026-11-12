import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Editorial Studio element layout order (Task 52)", () => {
  const studio = read("src/components/editorial/EditorialStudio.tsx");
  const tabs = read("src/components/editorial/social/SocialVariantTabs.tsx");
  const carousel = read("src/components/editorial/CarouselCard.tsx");

  it("renders elements in the exact order: Title -> Cover -> Carousel -> Captions", () => {
    // Locate the start of the main column stack
    const colStart = studio.indexOf('className="flex min-w-0 flex-[999_1_520px] flex-col gap-8"');
    expect(colStart).toBeGreaterThan(-1);

    const stackContent = studio.slice(colStart);

    const coverIndex = stackContent.indexOf("<CoverImageCard");
    const carouselIndex = stackContent.indexOf("<CarouselCard");
    const captionsIndex = stackContent.indexOf("{socialVariants}");

    expect(coverIndex).toBeGreaterThan(-1);
    expect(carouselIndex).toBeGreaterThan(-1);
    expect(captionsIndex).toBeGreaterThan(-1);

    // Assert strict ordering: Cover must appear before Carousel, and Carousel before Captions
    expect(coverIndex).toBeLessThan(carouselIndex);
    expect(carouselIndex).toBeLessThan(captionsIndex);
  });

  it("does not contain the dead or misleading '#linkedin-carousel' jump anchor in the LinkedIn tab", () => {
    expect(tabs).not.toContain('href="#linkedin-carousel"');
    expect(tabs).not.toContain("Edit its pages and text below ↓");
  });

  it("does not repeat the full carousel slide gallery inside the LinkedIn caption tab", () => {
    // In SocialVariantTabs, the LinkedIn tab should not embed another copy of the carousel slides
    expect(tabs).not.toContain("LinkedIn posts this carousel instead of the cover");
  });

  it("does not repeat the entire post text inside a redundant 'Post text with the carousel' list in CarouselCard", () => {
    expect(carousel).not.toContain('header="Post text with the carousel"');
  });
});
