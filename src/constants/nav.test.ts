import { describe, expect, it } from "vitest";
import { buildNavItems, isNavActive } from "./nav";

describe("buildNavItems", () => {
  it("is exactly the four calm places, in order", () => {
    expect(buildNavItems().map((i) => [i.name, i.href])).toEqual([
      ["Today", "/"],
      ["Ideas", "/ideas"],
      ["Posts", "/posts"],
      ["Brand", "/brand"],
    ]);
  });
});

describe("isNavActive", () => {
  const [today, , posts] = buildNavItems();
  it("matches Today only on the home path", () => {
    expect(isNavActive(today, "/")).toBe(true);
    expect(isNavActive(today, "/ideas")).toBe(false);
  });
  it("treats the review screen and old post pages as Posts", () => {
    for (const p of ["/posts", "/editorial", "/published", "/drafts/abc"]) expect(isNavActive(posts, p)).toBe(true);
    expect(isNavActive(posts, "/postsx")).toBe(false);
  });
});
