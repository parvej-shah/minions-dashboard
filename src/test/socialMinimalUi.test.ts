import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Minimal Captions UI (Task 54 - Impeccable Distill)", () => {
  const tabs = read("src/components/editorial/social/SocialVariantTabs.tsx");

  it("removes all fake mock social buttons (Like, Comment, Repost, Share, Send)", () => {
    // Assert no fake engagement buttons exist in SocialVariantTabs
    expect(tabs).not.toMatch(/<span>Like<\/span>/);
    expect(tabs).not.toMatch(/<span>Comment<\/span>/);
    expect(tabs).not.toMatch(/<span>Repost<\/span>/);
    expect(tabs).not.toMatch(/<span>Share<\/span>/);
    expect(tabs).not.toMatch(/<span>Send<\/span>/);
    expect(tabs).not.toContain("ThumbsUp");
    expect(tabs).not.toContain("actionBar=");
  });

  it("removes nested cards within cards (no nested shadow-soft or triple border boxes)", () => {
    // The panel inside the card should not declare another nested shadow-soft card
    expect(tabs).not.toMatch(/panelClass="[^"]*shadow-soft/);
  });

  it("preserves real user actions: Edit, Copy, and VariantEditor", () => {
    expect(tabs).toContain("<VariantActions");
    expect(tabs).toContain("<VariantEditor");
    expect(tabs).toContain("onCopy");
  });
});
