import { beforeEach, describe, expect, it, vi } from "vitest";
import { GOOD_TEMPLATE } from "@/lib/covers/custom/fixtures";

const rows: Record<string, unknown>[] = [];
const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
  const r = { ...data, id: "row", status: "ACTIVE", createdAt: new Date("2026-11-19") };
  rows.push(r);
  return r;
});
const findFirst = vi.fn();
const findMany = vi.fn(async () => []);
const updateMany = vi.fn(async (_args: { where: Record<string, unknown> }) => ({ count: 1 }));
const rate = vi.fn(async () => ({ allowed: true, remaining: 5 }));

vi.mock("@/lib/prisma", () => ({ prisma: { brandProfile: { findUnique: vi.fn(async () => null) }, coverTemplate: { create, findFirst, findMany, updateMany } } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: rate }));

const svc = await import("./coverTemplates");

beforeEach(() => {
  rows.length = 0;
  vi.clearAllMocks();
  rate.mockResolvedValue({ allowed: true, remaining: 5 });
  findMany.mockResolvedValue([]);
});

describe("saving", () => {
  it("stores a template that passes the check, scoped to the workspace", async () => {
    const saved = await svc.saveCoverTemplate("client-a", "user-1", GOOD_TEMPLATE);
    expect(saved.name).toBe("Soft Blue");
    expect(saved.version).toBe(1);
    expect(create.mock.calls[0][0].data).toMatchObject({ clientId: "client-a", createdBy: "user-1", version: 1 });
  });

  it("stores NOTHING when the contract is not met, and says why", async () => {
    const bad = GOOD_TEMPLATE.replace("<div data-cover-template", '<script>fetch("https://evil.test")</script><div data-cover-template');
    await expect(svc.saveCoverTemplate("client-a", "user-1", bad)).rejects.toMatchObject({ status: 422, extra: { errors: expect.any(Array) } });
    expect(create).not.toHaveBeenCalled();
  });

  it("stores nothing for non-text input", async () => {
    await expect(svc.saveCoverTemplate("client-a", "u", { html: "x" })).rejects.toMatchObject({ status: 422 });
    expect(create).not.toHaveBeenCalled();
  });

  it("adds a version when editing an existing design of this workspace", async () => {
    findFirst.mockResolvedValue({ templateKey: "k1", version: 2, status: "ACTIVE" });
    const saved = await svc.saveCoverTemplate("client-a", "u", GOOD_TEMPLATE, "k1");
    expect(saved.version).toBe(3);
    expect(findFirst.mock.calls[0][0].where).toMatchObject({ clientId: "client-a", templateKey: "k1" });
  });

  it("cannot edit another workspace's design (looked up by workspace, so it is not found)", async () => {
    findFirst.mockResolvedValue(null);
    await expect(svc.saveCoverTemplate("client-b", "u", GOOD_TEMPLATE, "k1")).rejects.toMatchObject({ status: 404 });
    expect(create).not.toHaveBeenCalled();
  });

  it("stops at ten designs", async () => {
    findMany.mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ templateKey: `k${i}` })) as never);
    await expect(svc.saveCoverTemplate("client-a", "u", GOOD_TEMPLATE)).rejects.toMatchObject({ status: 409 });
  });

  it("is rate limited", async () => {
    rate.mockResolvedValue({ allowed: false, remaining: 0 });
    await expect(svc.saveCoverTemplate("client-a", "u", GOOD_TEMPLATE)).rejects.toMatchObject({ status: 429 });
    await expect(svc.checkCoverTemplate("client-a", GOOD_TEMPLATE)).rejects.toMatchObject({ status: 429 });
  });
});

describe("loading", () => {
  it("re-validates stored HTML, so a tampered row never reaches the renderer", async () => {
    findFirst.mockResolvedValue({ sourceHtml: GOOD_TEMPLATE.replace("<div data-cover-template", "<script>1</script><div data-cover-template"), version: 1 });
    expect(await svc.loadCoverTemplate("client-a", "k1")).toBeNull();
  });

  it("returns a valid template, always asking for this workspace's row", async () => {
    findFirst.mockResolvedValue({ sourceHtml: GOOD_TEMPLATE, version: 4 });
    const t = await svc.loadCoverTemplate("client-a", "k1", 4);
    expect(t?.version).toBe(4);
    expect(findFirst.mock.calls[0][0].where).toMatchObject({ clientId: "client-a", templateKey: "k1", version: 4 });
  });

  it("returns null for another workspace's design", async () => {
    findFirst.mockResolvedValue(null);
    expect(await svc.loadCoverTemplate("client-b", "k1")).toBeNull();
  });
});

describe("check and archive", () => {
  it("check reports errors and writes nothing", async () => {
    const r = await svc.checkCoverTemplate("client-a", "<div>");
    expect(r.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("archive is scoped to the workspace and 404s when nothing matched", async () => {
    await svc.archiveCoverTemplate("client-a", "k1");
    expect(updateMany.mock.calls[0][0].where).toEqual({ clientId: "client-a", templateKey: "k1" });
    updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(svc.archiveCoverTemplate("client-b", "k1")).rejects.toMatchObject({ status: 404 });
  });
});
