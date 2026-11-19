import { beforeEach, describe, expect, it, vi } from "vitest";

const m = {
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  startDraftRun: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: { idea: { findFirst: m.findFirst, findUnique: m.findUnique, findMany: m.findMany, update: m.update } },
}));
vi.mock("@/services/drafting", () => ({ startDraftRun: m.startDraftRun }));
vi.mock("@/services/ideas", () => ({ createIdeaWithNextId: m.create }));

const { startStarterSet } = await import("@/services/starterSet");

beforeEach(() => {
  vi.clearAllMocks();
  m.findFirst.mockResolvedValue(null);
  m.findUnique.mockResolvedValue({ rawIdea: "We cut onboarding to 3 steps.", memoryIds: ["m1"], sourceType: "LIVED", trustBasis: ["LIVED_EXPERIENCE"] });
  m.findMany.mockResolvedValue([]);
  m.create.mockImplementation(async (data: { pillar: string }) => ({ id: `IDEA-${data.pillar}` }));
  m.startDraftRun.mockResolvedValue({ runId: "r1" });
});

describe("startStarterSet", () => {
  it("drafts two reframes of the story when nothing was harvested", async () => {
    const res = await startStarterSet("c1", "first");
    expect(res.started).toBe(2);
    expect(m.create).toHaveBeenCalledTimes(2);
    const pillars = m.create.mock.calls.map((c) => c[0].pillar);
    expect(new Set(pillars).size).toBe(2);
    expect(m.startDraftRun).toHaveBeenCalledTimes(2);
  });

  it("does nothing the second time", async () => {
    m.findFirst.mockResolvedValue({ id: "x" });
    const res = await startStarterSet("c1", "first");
    expect(res.started).toBe(0);
    expect(m.startDraftRun).not.toHaveBeenCalled();
  });

  it("never throws when drafting fails", async () => {
    m.startDraftRun.mockRejectedValue(new Error("n8n down"));
    await expect(startStarterSet("c1", "first")).resolves.toEqual({ started: 0 });
  });

  it("never throws when the database fails", async () => {
    m.findFirst.mockRejectedValue(new Error("db"));
    await expect(startStarterSet("c1", "first")).resolves.toEqual({ started: 0 });
  });
});
