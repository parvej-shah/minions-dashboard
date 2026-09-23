import { beforeEach, describe, expect, it, vi } from "vitest";

const laneCount = vi.fn();
const laneCreateMany = vi.fn();
const laneFindMany = vi.fn();
const icpFindUnique = vi.fn();
const icpCreateMany = vi.fn();
const memoryFindMany = vi.fn();
const directiveFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contentLane: { count: laneCount, createMany: laneCreateMany, findMany: laneFindMany },
    icpProfile: { findUnique: icpFindUnique, createMany: icpCreateMany },
    professionalMemory: { findMany: memoryFindMany },
    brandDirective: { findMany: directiveFindMany },
  },
}));

const { ensureAuthorDefaults, getAuthorContext, MEMORY_LIMIT } = await import("./authorContext");
const { DEFAULT_LANES } = await import("@/constants/contentLanes");

beforeEach(() => {
  vi.clearAllMocks();
  laneFindMany.mockResolvedValue([]);
  memoryFindMany.mockResolvedValue([]);
});

describe("ensureAuthorDefaults (tenants created after the migration)", () => {
  it("seeds the default lanes and an ICP from the tenant's AUDIENCE directives", async () => {
    laneCount.mockResolvedValue(0);
    icpFindUnique.mockResolvedValue(null);
    directiveFindMany.mockResolvedValue([{ instruction: "Roofing company owners." }, { instruction: "5-50 staff." }]);

    await ensureAuthorDefaults("c-new");

    const lanes = laneCreateMany.mock.calls[0][0];
    expect(lanes.skipDuplicates).toBe(true);
    expect(lanes.data.map((l: { name: string }) => l.name)).toEqual(DEFAULT_LANES.map((l) => l.name));
    // Same deterministic ids the SQL seed uses, so the two can never double up.
    expect(lanes.data[0].id).toBe("LANE-c-new-icp-problems");
    // Retired PEER/BRIDGE audience directives never shape the ICP.
    expect(directiveFindMany.mock.calls[0][0].where.audienceScope).toEqual({ in: ["ALL", "ICP"] });
    expect(icpCreateMany.mock.calls[0][0].data[0]).toMatchObject({ id: "ICP-c-new", who: "Roofing company owners. 5-50 staff." });
  });

  it("leaves a tenant that already has lanes and an ICP alone", async () => {
    laneCount.mockResolvedValue(4);
    icpFindUnique.mockResolvedValue({ id: "ICP-c1" });
    await ensureAuthorDefaults("c1");
    expect(laneCreateMany).not.toHaveBeenCalled();
    expect(icpCreateMany).not.toHaveBeenCalled();
  });
});

describe("getAuthorContext", () => {
  it("returns active memory least-used first, capped, in the wire shape", async () => {
    laneCount.mockResolvedValue(4);
    icpFindUnique.mockResolvedValue({ id: "ICP-c1", who: "Owners", role: "", companyType: "", pains: ["missed calls"], decisions: [], questions: [], buyingTriggers: [], vocabulary: [] });
    memoryFindMany.mockResolvedValue([{ id: "m1", kind: "STORY", content: "A story.", disclosure: "GENERALIZE", usedCount: 0 }]);

    const ctx = await getAuthorContext("c1");

    const query = memoryFindMany.mock.calls[0][0];
    expect(query.where).toEqual({ clientId: "c1", isActive: true });
    expect(query.orderBy[0]).toEqual({ usedCount: "asc" });
    expect(query.take).toBe(MEMORY_LIMIT);
    expect(ctx.memory).toEqual([{ id: "m1", kind: "STORY", content: "A story.", disclosure: "GENERALIZE", used_count: 0 }]);
    expect(ctx.icp.pains).toEqual(["missed calls"]);
  });
});
