import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Posts Header & Equal Width Tabs (Task 73)", () => {
  const filtersTs = read("src/components/ui/Filters.tsx");
  const postsLibrary = read("src/components/posts/PostsLibrary.tsx");

  it("Segmented in Filters.tsx supports equalWidth option with grid-flow-col auto-cols-fr", () => {
    expect(filtersTs).toMatch(/equalWidth/);
    expect(filtersTs).toMatch(/grid-flow-col\s+auto-cols-fr/);
    expect(filtersTs).toMatch(/justify-center/);
  });

  it("PostsLibrary uses equalWidth on the Segmented post filter tabs", () => {
    expect(postsLibrary).toMatch(/<Segmented[\s\S]*?equalWidth/);
  });

  it("PostsLibrary header cleanly isolates title/subtitle from the right-side action cluster", () => {
    // PageHeader must not have action prop awkwardly placing button next to subtitle
    expect(postsLibrary).not.toMatch(/<PageHeader[^>]*action=\{/);
    // + Quick draft button must be grouped with Search in the controls area
    expect(postsLibrary).toMatch(/Quick draft[\s\S]*?SearchField|SearchField[\s\S]*?Quick draft/);
  });
});
