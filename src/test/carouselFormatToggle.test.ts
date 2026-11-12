import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Carousel Card 'Make again' removal & Format toggle UX pass (Task 62)", () => {
  const card = read("src/components/editorial/CarouselCard.tsx");
  const segmented = read("src/components/ui/Segmented.tsx");

  it("removes the 'Make again' button from CarouselCard", () => {
    expect(card).not.toContain('label={busy === "make" ? "Writing the slides…" : "Make again"}');
    expect(card).not.toContain("Writes new slides from the draft");
    expect(card).not.toContain("confirmRemake");
    expect(card).not.toContain("Make the carousel again?");
  });

  it("Segmented component supports icons and refined styling", () => {
    expect(segmented).toMatch(/icon/);
  });

  it("passes icons to the Post format segmented toggle in CarouselCard", () => {
    expect(card).toMatch(/GalleryHorizontal/);
    expect(card).toMatch(/ImageIcon/);
  });
});
