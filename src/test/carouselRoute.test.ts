import { beforeEach, describe, expect, it, vi } from "vitest";

const m = {
  getCurrentUser: vi.fn(),
  requireClientId: vi.fn(),
  generateCarousel: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/tenant", () => ({ getCurrentUser: m.getCurrentUser, requireClientId: m.requireClientId, isPlaceholderTenantName: () => false }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/services/assets", () => ({ requireOwnedAssetId: vi.fn(async (_c: string, id: string) => id) }));
vi.mock("@/services/carousel", () => ({ generateCarousel: m.generateCarousel, editCarousel: vi.fn(), setCarouselActive: vi.fn(), carouselState: vi.fn() }));

const route = await import("@/app/api/assets/[id]/carousel/route");

const post = (body?: unknown) =>
  route.POST(new Request("http://x", { method: "POST", ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), { params: Promise.resolve({ id: "a1" }) });

beforeEach(() => {
  vi.clearAllMocks();
  m.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co", clientId: "c1", role: "USER" });
  m.requireClientId.mockResolvedValue({ clientId: "c1", user: { id: "u1" } });
  m.generateCarousel.mockResolvedValue({ ok: true, carousel: {} });
});

describe("POST /api/assets/[id]/carousel", () => {
  it("lets the writer choose when no style is sent", async () => {
    expect((await post()).status).toBe(200);
    expect(m.generateCarousel).toHaveBeenCalledWith("a1", { style: undefined });
  });

  it("passes the reviewer's chosen style", async () => {
    expect((await post({ style: "AURORA" })).status).toBe(200);
    expect(m.generateCarousel).toHaveBeenCalledWith("a1", { style: "AURORA" });
  });

  it("refuses an unknown style", async () => {
    expect((await post({ style: "NEON" })).status).toBe(400);
    expect(m.generateCarousel).not.toHaveBeenCalled();
  });
});
