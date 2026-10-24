import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { idea: { findMany } } }));

const { listIdeas } = await import("./ideas");

const row = (id: string, status: string, published: boolean) => ({
  id, rawIdea: `Idea ${id}`, angle: null, audience: "ICP", targetTrade: null, pillar: null, source: "MANUAL",
  sourceUrl: null, sourceTitle: null, signals: [], why: null, status, priority: null, tags: [],
  scheduledFor: null, queueOrder: null, draftAssetId: null, rejectionReason: null, gateVerdict: null,
  gateReasons: [], scoreBreakdown: null, icpProblem: null, authorAdvantage: null, sourceType: null,
  trustBasis: [], memoryIds: [], createdAt: new Date(0), updatedAt: new Date(0),
  assets: published ? [{ id: `A-${id}` }] : [],
});

describe("listIdeas", () => {
  beforeEach(() => findMany.mockReset());

  it("shows an idea as published once its draft went out, though the publisher left it at REVIEW", async () => {
    findMany.mockResolvedValue([row("IDEA-1", "REVIEW", true), row("IDEA-2", "REVIEW", false), row("IDEA-3", "REFINED", false)]);
    const ideas = await listIdeas("tenant");
    expect(ideas.map((i) => i.status)).toEqual(["PUBLISHED", "REVIEW", "REFINED"]);
    expect(ideas[0]).not.toHaveProperty("assets");
    expect(findMany.mock.calls[0][0].where).toEqual({ clientId: "tenant" });
  });
});
