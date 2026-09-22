import { beforeEach, describe, expect, it, vi } from "vitest";

const ideaFindFirst = vi.fn();
const assetFindFirst = vi.fn();
const scheduleFindFirst = vi.fn();
const directiveCount = vi.fn();
const directiveCreate = vi.fn();
const requireClientId = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    idea: { findFirst: ideaFindFirst },
    asset: { findFirst: assetFindFirst },
    postingSchedule: { findFirst: scheduleFindFirst },
    brandDirective: { count: directiveCount, create: directiveCreate },
  },
}));
vi.mock("@/lib/tenant", () => ({ requireClientId }));

const { isEstablishedTenant, refuseOnboardingOverwrite } = await import("./onboardingGuard");
const directivesRoute = await import("@/app/api/brand/directives/route");

function state({ idea = false, asset = false, schedule = false }) {
  ideaFindFirst.mockResolvedValue(idea ? { id: "i" } : null);
  assetFindFirst.mockResolvedValue(asset ? { id: "a" } : null);
  scheduleFindFirst.mockResolvedValue(schedule ? { id: "s" } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
  requireClientId.mockResolvedValue({ clientId: "tenant-zero-getminions-ai" });
});

describe("isEstablishedTenant", () => {
  it("a workspace mid-way through its first onboarding is not established", async () => {
    state({});
    expect(await isEstablishedTenant("c")).toBe(false);
    expect(await refuseOnboardingOverwrite("c")).toBeNull();
  });

  it.each([["ideas", { idea: true }], ["assets", { asset: true }], ["a posting schedule", { schedule: true }]])(
    "a workspace with %s is established, and onboarding writes get a 409",
    async (_label, s) => {
      state(s);
      expect(await isEstablishedTenant("c")).toBe(true);
      const res = await refuseOnboardingOverwrite("c");
      expect(res?.status).toBe(409);
      expect((await res!.json()).error).toMatch(/already set up/);
    }
  );
});

describe("POST /api/brand/directives (shared by onboarding and the Brand page)", () => {
  const post = (body: Record<string, unknown>) =>
    directivesRoute.POST(new Request("http://x/api/brand/directives", { method: "POST", body: JSON.stringify(body) }));
  const directive = { category: "VOICE", key: "tone", content: "Plain words." };

  it("refuses the onboarding wizard's write on an established workspace", async () => {
    state({ idea: true });
    const res = await post({ ...directive, from_onboarding: true });
    expect(res.status).toBe(409);
    expect(directiveCreate).not.toHaveBeenCalled();
  });

  it("still lets the Brand page add a directive to an established workspace", async () => {
    state({ idea: true });
    directiveCount.mockResolvedValue(0);
    directiveCreate.mockImplementation(async ({ data }) => ({ ...data, createdAt: new Date(), updatedAt: new Date() }));
    const res = await post(directive);
    expect(res.status).toBe(201);
    expect(directiveCreate).toHaveBeenCalledOnce();
  });
});
