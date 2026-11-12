import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Carousel Card naming and platform independence (Task 59)", () => {
  const card = read("src/components/editorial/CarouselCard.tsx");

  it("does not label the section 'LinkedIn carousel'", () => {
    expect(card).not.toContain("LinkedIn carousel");
    expect(card).not.toContain("Loading LinkedIn carousel");
    expect(card).not.toContain("Could not load the LinkedIn carousel");
  });

  it("names the section 'Carousel' matching the 'Cover' section style", () => {
    expect(card).toMatch(/<span[^>]*text-\[17px\][^>]*>Carousel<\/span>/);
  });

  it("describes the carousel without restricting it solely to LinkedIn", () => {
    expect(card).not.toContain("A carousel is a swipeable PDF on LinkedIn");
    expect(card).toMatch(/swipeable/i);
  });
});
