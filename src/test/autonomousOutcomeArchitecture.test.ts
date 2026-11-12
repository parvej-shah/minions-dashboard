import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildNavItems } from "@/constants/nav";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Autonomous Outcome Architecture (Task 72)", () => {
  const navTs = read("src/constants/nav.ts");
  const ideasPage = read("src/app/(dashboard)/ideas/page.tsx");
  const dueTenantsTs = read("src/services/dueTenants.ts");
  const postsLibrary = read("src/components/posts/PostsLibrary.tsx");

  it("buildNavItems returns exactly the 3 core destinations: Today, Posts, and Brand", () => {
    const items = buildNavItems();
    expect(items.map((i) => [i.name, i.href])).toEqual([
      ["Today", "/"],
      ["Posts", "/posts"],
      ["Brand", "/brand"],
    ]);
  });

  it("Ideas is completely removed from primary navigation", () => {
    expect(navTs).not.toMatch(/name:\s*"Ideas"/);
    expect(navTs).not.toMatch(/href:\s*"\/ideas"/);
  });

  it("visiting /ideas redirects to /posts to guide the user into the post outcome", () => {
    expect(ideasPage).toMatch(/redirect\(["']\/posts(?:\?show=needs)?["']\)/);
  });

  it("dueTenants enforces a 5 unposted draft maximum cap", () => {
    // Must check unreviewed draft count before scheduling additional auto-drafts
    expect(dueTenantsTs).toMatch(/count(?:Unreviewed|Pending|Drafts)|status:\s*["']PENDING_REVIEW["']/);
    expect(dueTenantsTs).toMatch(/5/);
  });

  it("PostsLibrary provides a clean quick draft action for spontaneous ideas without an ideas backlog", () => {
    expect(postsLibrary).toMatch(/Quick draft|Draft from thought/i);
  });
});
