import { describe, expect, it } from "vitest";
import type { IdeaItem } from "@/types";
import { countByStage, filterIdeas } from "./ideaFilter";

function idea(over: Partial<IdeaItem>): IdeaItem {
  return { id: "a", ideaId: "a", title: "", raw_idea: "", excerpt: "", angle: "", status: "REFINED", tags: [], created_at: "2026-01-01T00:00:00Z", ...over } as IdeaItem;
}

describe("filterIdeas", () => {
  const older = idea({ id: "old", ideaId: "old", title: "Pricing pages", created_at: "2026-01-01T00:00:00Z" });
  const newer = idea({ id: "new", ideaId: "new", title: "Hiring", tags: ["Ops"], status: "QUEUED", created_at: "2026-02-01T00:00:00Z" });

  it("lists the oldest idea first", () => {
    expect(filterIdeas([newer, older], "ALL", "").map((i) => i.id)).toEqual(["old", "new"]);
  });

  it("filters by the stage a status maps to, not the raw status", () => {
    expect(filterIdeas([older, newer], "QUEUED", "").map((i) => i.id)).toEqual(["new"]);
  });

  it("matches the search text against title, id and tags", () => {
    expect(filterIdeas([older, newer], "ALL", "ops").map((i) => i.id)).toEqual(["new"]);
    expect(filterIdeas([older, newer], "ALL", " PRICING ").map((i) => i.id)).toEqual(["old"]);
  });

  it("counts a stage and the whole list", () => {
    expect(countByStage([older, newer], "ALL")).toBe(2);
    expect(countByStage([older, newer], "QUEUED")).toBe(1);
  });
});
