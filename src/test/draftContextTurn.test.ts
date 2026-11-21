import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  idea: { findFirst: vi.fn() },
  icpProfile: { findUnique: vi.fn() },
  brandProfile: { findUnique: vi.fn() },
  asset: { findMany: vi.fn(), count: vi.fn() },
  professionalMemory: { findMany: vi.fn(), update: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/ai/memoryCheck", () => ({ checkMemory: vi.fn() }));

const { getDraftAuthorContext } = await import("@/services/draftContext");

const idea = (tags: string[] = []) => ({
  id: "IDEA-1", clientId: "c1", sourceType: "PAST_EXPERIENCE", trustBasis: ["LIVED_EXPERIENCE"], memoryIds: ["m1"], gateVerdict: "PASS", source: "HARVEST",
  icpProblem: null, readerContext: null, authorAdvantage: null, whiteSpace: null, freshPerspective: null, vision: null, recommendedFormat: "POST", pillar: null, lane: null, tags,
  rawIdea: "x", angle: null, why: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.icpProfile.findUnique.mockResolvedValue(null);
  db.brandProfile.findUnique.mockResolvedValue(null);
  db.professionalMemory.findMany.mockResolvedValue([{ id: "m1", kind: "STORY", content: "We lost a booking.", disclosure: "PUBLIC", isActive: true }]);
  db.asset.findMany.mockResolvedValue([{ title: "T", coreArgument: "A booking counts when the calendar confirms it.", hook: "Most teams think   the agent is the hard part." }]);
});

describe("getDraftAuthorContext rotates the opening by the workspace's post count", () => {
  it("the workspace's first post keeps the first opening", async () => {
    db.idea.findFirst.mockResolvedValue(idea());
    db.asset.count.mockResolvedValue(0);
    expect((await getDraftAuthorContext("c1", "IDEA-1")).hook.archetype).toBe("AUTHOR SCENE");
  });

  it("a later post of the same kind opens differently", async () => {
    db.idea.findFirst.mockResolvedValue(idea());
    db.asset.count.mockResolvedValue(1);
    expect((await getDraftAuthorContext("c1", "IDEA-1")).hook.archetype).not.toBe("AUTHOR SCENE");
  });

  it("starter-set posts keep the openings the set planned (phase 1)", async () => {
    db.idea.findFirst.mockResolvedValue(idea(["Starter set"]));
    db.asset.count.mockResolvedValue(5);
    expect((await getDraftAuthorContext("c1", "IDEA-1")).hook.archetype).toBe("AUTHOR SCENE");
  });

  it("passes the recent first lines, whitespace collapsed", async () => {
    db.idea.findFirst.mockResolvedValue(idea());
    db.asset.count.mockResolvedValue(1);
    const ctx = await getDraftAuthorContext("c1", "IDEA-1");
    expect(ctx.recent_openings).toEqual(["Most teams think the agent is the hard part."]);
    expect(ctx.recent_posts).toEqual(["A booking counts when the calendar confirms it."]);
  });

  it("still drafts when counting fails", async () => {
    db.idea.findFirst.mockResolvedValue(idea());
    db.asset.count.mockRejectedValue(new Error("db"));
    expect((await getDraftAuthorContext("c1", "IDEA-1")).hook.archetype).toBe("AUTHOR SCENE");
  });
});
