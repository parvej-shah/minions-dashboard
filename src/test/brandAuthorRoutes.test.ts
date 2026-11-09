import { beforeEach, describe, expect, it, vi } from "vitest";

const m = {
  memCount: vi.fn(),
  memCreate: vi.fn(),
  memFindFirst: vi.fn(),
  memUpdate: vi.fn(),
  memDeleteMany: vi.fn(),
  memFindMany: vi.fn(),
  ideaFindMany: vi.fn(),
  icpUpsert: vi.fn(),
  dirUpdateMany: vi.fn(),
  dirUpsert: vi.fn(),
  transaction: vi.fn(),
  requireClientId: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    professionalMemory: { count: m.memCount, create: m.memCreate, findFirst: m.memFindFirst, update: m.memUpdate, deleteMany: m.memDeleteMany, findMany: m.memFindMany },
    idea: { findMany: m.ideaFindMany },
    icpProfile: { upsert: m.icpUpsert },
    brandDirective: { updateMany: m.dirUpdateMany, upsert: m.dirUpsert },
    $transaction: m.transaction,
  },
}));
vi.mock("@/lib/tenant", () => ({ requireClientId: m.requireClientId }));

const memory = await import("@/app/api/brand/memory/route");
const memoryItem = await import("@/app/api/brand/memory/[id]/route");
const icp = await import("@/app/api/brand/icp/route");

const row = (over: Record<string, unknown> = {}) => ({
  id: "mem-1", clientId: "c1", kind: "LESSON", content: "A lesson long enough to keep.", disclosure: "PUBLIC", source: "BRAND_PAGE",
  isActive: true, usedCount: 0, lastUsedAt: null, createdAt: new Date("2026-09-23T00:00:00Z"), updatedAt: new Date("2026-09-23T00:00:00Z"), ...over,
});
const req = (method: string, body: unknown) => new Request("http://x", { method, body: JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  m.requireClientId.mockResolvedValue({ clientId: "c1" });
  m.memCount.mockResolvedValue(0);
  m.ideaFindMany.mockResolvedValue([]);
  m.transaction.mockImplementation(async (ops: unknown[]) => ops);
});

describe("POST /api/brand/memory", () => {
  const good = { kind: "LESSON", content: "Our first booking agent confirmed calls that never reached the calendar.", disclosure: "GENERALIZE" };

  it("saves a valid item to the caller's own workspace", async () => {
    m.memCreate.mockImplementation(async ({ data }) => row(data));
    const res = await memory.POST(req("POST", good));
    expect(res.status).toBe(201);
    expect(m.memCreate.mock.calls[0][0].data).toMatchObject({ clientId: "c1", kind: "LESSON", disclosure: "GENERALIZE", source: "BRAND_PAGE" });
  });

  it("refuses contact details even if the page's check was skipped", async () => {
    const res = await memory.POST(req("POST", { ...good, content: "Ask the owner, jane@acme-roofing.com, about the rollout." }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/contact details/);
    expect(m.memCreate).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...good, kind: "SECRET" }, /kind/],
    [{ ...good, disclosure: "PRIVATE" }, /PUBLIC or GENERALIZE/],
    [{ ...good, content: "too short" }, /at least/],
  ])("rejects bad input %#", async (body, message) => {
    const res = await memory.POST(req("POST", body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(message);
  });

  it("GET counts how many ideas use each item, within the workspace", async () => {
    m.memFindMany.mockResolvedValue([row(), row({ id: "mem-2" })]);
    m.ideaFindMany.mockResolvedValue([{ memoryIds: ["mem-1"] }, { memoryIds: ["mem-1", "mem-2"] }]);
    const res = await memory.GET(new Request("http://x"));
    const body = await res.json();
    expect(m.ideaFindMany.mock.calls[0][0].where).toEqual({ clientId: "c1", memoryIds: { hasSome: ["mem-1", "mem-2"] } });
    expect(body.map((i: { used_in_ideas: number }) => i.used_in_ideas)).toEqual([2, 1]);
  });
});

describe("PATCH/DELETE /api/brand/memory/[id] stay inside the workspace", () => {
  it("PATCH looks the item up by id AND workspace, and 404s another workspace's item", async () => {
    m.memFindFirst.mockResolvedValue(null);
    const res = await memoryItem.PATCH(req("PATCH", { is_active: false }), params("mem-other"));
    expect(res.status).toBe(404);
    expect(m.memFindFirst.mock.calls[0][0].where).toEqual({ id: "mem-other", clientId: "c1" });
    expect(m.memUpdate).not.toHaveBeenCalled();
  });

  it("PATCH switches disclosure", async () => {
    m.memFindFirst.mockResolvedValue(row());
    m.memUpdate.mockImplementation(async ({ data }) => row(data));
    const res = await memoryItem.PATCH(req("PATCH", { disclosure: "GENERALIZE" }), params("mem-1"));
    expect((await res.json()).disclosure).toBe("GENERALIZE");
  });

  it("DELETE is scoped to the workspace", async () => {
    m.memDeleteMany.mockResolvedValue({ count: 0 });
    const res = await memoryItem.DELETE(req("DELETE", {}), params("mem-other"));
    expect(res.status).toBe(404);
    expect(m.memDeleteMany.mock.calls[0][0].where).toEqual({ id: "mem-other", clientId: "c1" });
  });
});

describe("PUT /api/brand/icp", () => {
  it("saves the profile and rewrites the derived AUDIENCE directive, retiring the old audience tags", async () => {
    m.icpUpsert.mockImplementation(async ({ create }) => ({ ...create, updatedAt: new Date() }));
    const res = await icp.PUT(req("PUT", { who: "Owners of roofing firms.", pains: ["Missed calls", "missed calls", " "] }));
    expect(res.status).toBe(200);
    // De-duplicated and trimmed.
    expect(m.icpUpsert.mock.calls[0][0].update.pains).toEqual(["Missed calls"]);
    expect(m.dirUpdateMany.mock.calls[0][0].where).toEqual({ clientId: "c1", category: "AUDIENCE", isActive: true, id: { not: "DIR-ICP-c1" } });
    expect(m.dirUpsert.mock.calls[0][0].create).toMatchObject({ id: "DIR-ICP-c1", category: "AUDIENCE", audienceScope: "ICP", instruction: "Owners of roofing firms. Their pains: Missed calls. They buy the outcome, not the technology: lead with what changes for them and keep how it works to one plain sentence." });
    expect(m.icpUpsert.mock.calls[0][0].update.buyer).toBe("OUTCOME");
  });
});
