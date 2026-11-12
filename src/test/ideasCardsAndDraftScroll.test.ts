import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Idea Cards Architecture (Task 65)", () => {
  const ideaRow = read("src/components/ideas/IdeaRow.tsx");
  const ideasPage = read("src/app/(dashboard)/ideas/page.tsx");
  const ideasSkeleton = read("src/components/ideas/IdeasSkeleton.tsx");

  it("IdeaRow renders as an enclosed tactile Card with rounded borders and shadow", () => {
    // Should render as an enclosed card, not a bare border-b divided row
    expect(ideaRow).toMatch(/bg-surface/);
    expect(ideaRow).toMatch(/rounded-(?:2xl|\[2\dpx\])/);
    expect(ideaRow).toMatch(/shadow-soft/);
    expect(ideaRow).toMatch(/border\s+border-line/);
  });

  it("IdeaRow highlights #1 top idea with distinct badge and gives other ideas clean position pills", () => {
    // Top idea should have distinct Up next / queue badge
    expect(ideaRow).toMatch(/isTop\s*\?/);
    expect(ideaRow).toMatch(/#1\s+Up\s+next|#1\s+Next/i);
    // Non-top items display their position
    expect(ideaRow).toMatch(/#\{p\.place\}/);
  });

  it("IdeaRow displays a clear scheduled slot pill with draft indicator dot", () => {
    // Slot timing should read "Drafts {time}" or similar scannable status
    expect(ideaRow).toMatch(/Drafts\s+/);
    expect(ideaRow).toMatch(/rounded-full\s+bg-brand/);
  });

  it("IdeaRow gives tactile button styling with >=44px touch targets", () => {
    // Buttons must adhere to Impeccable 44px minimum
    expect(ideaRow).toMatch(/min-h-11/);
    // Write now on non-top ideas should use tactile secondary styling rather than raw text link
    expect(ideaRow).toMatch(/variant:\s*"secondary"/);
  });

  it("IdeasPage redirects to posts queue to focus on the completed post outcome", () => {
    expect(ideasPage).toMatch(/redirect\(["']\/posts(?:\?show=needs)?["']\)/);
  });

  it("IdeasSkeleton reflects the card architecture instead of divide-y lines", () => {
    // Skeletons should be rounded cards with spacing
    expect(ideasSkeleton).not.toMatch(/divide-y/);
    expect(ideasSkeleton).toMatch(/rounded-(?:2xl|\[2\dpx\])/);
  });
});
