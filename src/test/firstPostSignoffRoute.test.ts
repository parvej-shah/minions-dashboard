import { beforeEach, describe, expect, it, vi } from "vitest";

const m = {
  requireClientId: vi.fn(),
  profileFind: vi.fn(),
  profileUpdate: vi.fn(),
  clientFind: vi.fn(),
  clientUpdate: vi.fn(),
  assetFind: vi.fn(),
  renderAssetCover: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    brandProfile: { findUnique: m.profileFind, update: m.profileUpdate },
    client: { findUnique: m.clientFind, update: m.clientUpdate },
    asset: { findFirst: m.assetFind },
  },
}));
vi.mock("@/lib/tenant", () => ({
  requireClientId: m.requireClientId,
  isPlaceholderTenantName: (n: string | null | undefined) => !n?.trim() || /'s Workspace$/.test(n.trim()),
}));
vi.mock("@/services/cover", () => ({ renderAssetCover: m.renderAssetCover }));

const route = await import("@/app/api/onboarding/first-post/signoff/route");

const req = (body: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  m.requireClientId.mockResolvedValue({ clientId: "c1", user: { id: "u1" } });
  m.profileFind.mockResolvedValue({ brandName: "Parvej Shah", coverByline: null });
  m.clientFind.mockResolvedValue({ name: "parvej's Workspace" });
  m.assetFind.mockResolvedValue({ id: "a1" });
  m.renderAssetCover.mockResolvedValue({ ok: true, url: "https://cdn/x.png" });
});

describe("POST /api/onboarding/first-post/signoff", () => {
  it("saves a changed sign-off and redraws the cover keeping its headline", async () => {
    const res = await route.POST(req({ name: "Parvej Shah", role: "Founder at Minions" }));
    expect(res.status).toBe(200);
    expect(m.profileUpdate).toHaveBeenCalledWith({ where: { clientId: "c1" }, data: { brandName: "Parvej Shah", coverByline: "Founder at Minions" } });
    expect(m.clientUpdate).toHaveBeenCalledWith({ where: { id: "c1" }, data: { name: "Parvej Shah" } });
    expect(m.renderAssetCover).toHaveBeenCalledWith("a1", { edit: {} });
    expect((await res.json()).hero_image_url).toBe("https://cdn/x.png");
  });

  it("does nothing when the sign-off is unchanged", async () => {
    const res = await route.POST(req({ name: "Parvej Shah", role: "" }));
    expect(res.status).toBe(200);
    expect(m.profileUpdate).not.toHaveBeenCalled();
    expect(m.renderAssetCover).not.toHaveBeenCalled();
  });

  it("never renames a workspace someone already named", async () => {
    m.clientFind.mockResolvedValue({ name: "Acme" });
    await route.POST(req({ name: "Jordan Lee", role: "" }));
    expect(m.clientUpdate).not.toHaveBeenCalled();
  });

  it("refuses an empty name", async () => {
    const res = await route.POST(req({ name: "  ", role: "Founder" }));
    expect(res.status).toBe(400);
    expect(m.profileUpdate).not.toHaveBeenCalled();
  });

  it("keeps the saved name when the cover cannot be redrawn", async () => {
    m.renderAssetCover.mockResolvedValue({ ok: false, error: "locked" });
    const res = await route.POST(req({ name: "Jordan Lee", role: "" }));
    expect(res.status).toBe(200);
    expect(m.profileUpdate).toHaveBeenCalled();
    expect((await res.json()).cover_error).toBe("locked");
  });
});
