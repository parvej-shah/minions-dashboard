import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Unified Carousel Decision & LinkedIn Edit Affordance (Task 56)", () => {
  const carouselCard = read("src/components/editorial/CarouselCard.tsx");
  const tabs = read("src/components/editorial/social/SocialVariantTabs.tsx");
  const route = read("src/app/api/assets/[id]/carousel/route.ts");

  it("unifies the post format decision in CarouselCard (not labeled 'Post on LinkedIn')", () => {
    expect(carouselCard).not.toContain("Post on LinkedIn");
    expect(carouselCard).toMatch(/Post format/i);
    expect(carouselCard).toContain("Single poster");
  });

  it("removes the duplicate format toggle from the Instagram tab in SocialVariantTabs", () => {
    expect(tabs).not.toContain('label="Instagram format"');
    expect(tabs).not.toContain("onInstagramFormat");
  });

  it("restores the Edit post button on the LinkedIn tab without locking it out on carousels", () => {
    expect(tabs).not.toContain("canEdit: false");
    expect(tabs).not.toContain("onChange: () => {}");
  });

  it("supports updating both active and instagram format in a single PATCH request", () => {
    expect(route).toMatch(/setInstagramFormat/);
    expect(route).toMatch(/setCarouselActive/);
  });
});
