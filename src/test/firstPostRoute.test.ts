import { beforeEach, describe, expect, it, vi } from "vitest";

const m = {
  getCurrentUser: vi.fn(),
  requireClientId: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/tenant", () => ({ getCurrentUser: m.getCurrentUser, requireClientId: m.requireClientId }));

const route = await import("@/app/api/onboarding/first-post/route");

const req = (body: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(body) });
const story = "We cut onboarding from 14 steps to 3 and activation doubled.";

beforeEach(() => {
  vi.clearAllMocks();
  m.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co", clientId: null, role: "USER" });
});

describe("POST /api/onboarding/first-post validate", () => {
  it("checks the story for a new user who has no workspace yet", async () => {
    const res = await route.POST(req({ validate: true, story, kind: "LESSON" }));
    expect(res.status).toBe(200);
    expect(m.requireClientId).not.toHaveBeenCalled();
  });

  it("refuses a story that is too short", async () => {
    const res = await route.POST(req({ validate: true, story: "short" }));
    expect(res.status).toBe(400);
  });

  it("refuses a caller who is not signed in", async () => {
    m.getCurrentUser.mockResolvedValue(null);
    const res = await route.POST(req({ validate: true, story }));
    expect(res.status).toBe(401);
  });
});
