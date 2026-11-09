import { describe, expect, it } from "vitest";
import { ideaGroup, ideasFor, sourceLine } from "./list";
import type { IdeaItem } from "@/types";

const idea = (id: string, status: string, extra: Partial<IdeaItem> = {}): IdeaItem =>
  ({ id, ideaId: id, title: id, raw_idea: id, excerpt: "", angle: "", status, source: "MANUAL", created_at: "2026-11-01T00:00:00Z", draftAssetId: null, tags: [], ...extra }) as unknown as IdeaItem;

describe("ideaGroup", () => {
  it("sorts every status into one plain group", () => {
    expect(ideaGroup(idea("a", "REFINED"))).toBe("next");
    expect(ideaGroup(idea("a", "HARVESTED"))).toBe("next");
    expect(ideaGroup(idea("a", "QUEUED"))).toBe("next");
    expect(ideaGroup(idea("a", "PICKED"))).toBe("writing");
    expect(ideaGroup(idea("a", "REVIEW"))).toBe("written");
    expect(ideaGroup(idea("a", "PUBLISHED"))).toBe("written");
    expect(ideaGroup(idea("a", "REJECTED"))).toBe("aside");
    expect(ideaGroup(idea("a", "FAILED"))).toBe("aside");
  });
  it("counts an idea with a draft as written, whatever its status says", () => {
    expect(ideaGroup(idea("a", "REFINED", { draftAssetId: "x" }))).toBe("written");
  });
});

describe("ideasFor", () => {
  const ideas = [
    idea("old", "REFINED", { created_at: "2026-10-01T00:00:00Z" }),
    idea("new", "REFINED", { created_at: "2026-11-05T00:00:00Z" }),
    idea("planned", "REFINED", { created_at: "2026-11-08T00:00:00Z" }),
    idea("done", "REVIEW", { updated_at: "2026-11-07T00:00:00Z" } as Partial<IdeaItem>),
    idea("gone", "REJECTED"),
  ];
  const plan = [{ idea_id: "planned", slot_at: "2026-11-10T15:00:00Z" }];

  it("puts the idea planned for the next slot first, then the rest oldest first", () => {
    const list = ideasFor(ideas, "next", plan, "");
    expect(list.map((x) => x.idea.id)).toEqual(["planned", "old", "new"]);
    expect(list[0].slotAt).toBe("2026-11-10T15:00:00Z");
    expect(list[1].slotAt).toBeNull();
  });
  it("filters by search text", () => {
    expect(ideasFor(ideas, "next", plan, "NEW").map((x) => x.idea.id)).toEqual(["new"]);
  });
  it("lists written and set-aside ideas", () => {
    expect(ideasFor(ideas, "written", plan, "").map((x) => x.idea.id)).toEqual(["done"]);
    expect(ideasFor(ideas, "aside", plan, "").map((x) => x.idea.id)).toEqual(["gone"]);
  });
});

describe("sourceLine", () => {
  it("says where an idea came from", () => {
    expect(sourceLine(idea("a", "REFINED"))).toEqual({ text: "Your own idea" });
    expect(sourceLine(idea("a", "REFINED", { source: "REDDIT", source_url: "https://r.x" }))).toEqual({ text: "From Reddit", href: "https://r.x" });
    expect(sourceLine(idea("a", "REFINED", { source: "SOURCE", source_url: "https://a.x" }))).toEqual({ text: "From an article", href: "https://a.x" });
    expect(sourceLine(idea("a", "REFINED", { source: "SIGNAL_HARVESTER" }))).toEqual({ text: "Found by Minions" });
  });
});
