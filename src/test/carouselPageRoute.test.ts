import { beforeEach, describe, expect, it, vi } from "vitest";

const m = { getCurrentUser: vi.fn(), requireClientId: vi.fn(), getCarouselPageUrls: vi.fn() };

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/tenant", () => ({ getCurrentUser: m.getCurrentUser, requireClientId: m.requireClientId, isPlaceholderTenantName: () => false }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/services/assets", () => ({ getCarouselPageUrls: m.getCarouselPageUrls }));
vi.mock("@/lib/r2", () => ({ r2KeyFromUrl: (u: string) => (u.startsWith("https://cdn.test/") ? u.slice(17) : null) }));

const route = await import("@/app/api/assets/[id]/carousel/page/[n]/route");
const get = (n: string) => route.GET(new Request("http://x"), { params: Promise.resolve({ id: "a1", n }) });

beforeEach(() => {
  vi.clearAllMocks();
  m.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co", clientId: "c1", role: "USER" });
  m.requireClientId.mockResolvedValue({ clientId: "c1", user: { id: "u1" } });
  m.getCarouselPageUrls.mockResolvedValue(["https://cdn.test/carousels/c1/a-01.jpg", "https://cdn.test/carousels/c1/a-02.jpg"]);
  vi.stubGlobal("fetch", vi.fn(async () => new Response("jpegbytes", { status: 200 })));
});

describe("GET /api/assets/[id]/carousel/page/[n]", () => {
  it("serves page n as a JPEG download, numbered from 1", async () => {
    const res = await get("2");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="page-02.jpg"');
    expect(fetch).toHaveBeenCalledWith("https://cdn.test/carousels/c1/a-02.jpg");
  });

  it("404s a page that is not in the deck", async () => {
    for (const n of ["0", "3", "x", "1.5"]) expect((await get(n)).status).toBe(404);
  });

  it("404s when the draft has no carousel pages", async () => {
    m.getCarouselPageUrls.mockResolvedValue([]);
    expect((await get("1")).status).toBe(404);
  });
});
