import { beforeEach, describe, expect, it, vi } from "vitest";

const m = {
  requireTenantAccess: vi.fn(),
  auth: vi.fn(),
  clientFind: vi.fn(),
  clientUpdate: vi.fn(),
  profileFind: vi.fn(),
  profileUpsert: vi.fn(),
  icpUpsert: vi.fn(),
  directiveDeleteMany: vi.fn(),
  directiveCreateMany: vi.fn(),
  channelUpsert: vi.fn(),
  syncIcpDirective: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: { findUnique: m.clientFind, update: m.clientUpdate },
    brandProfile: { findUnique: m.profileFind, upsert: m.profileUpsert },
    icpProfile: { upsert: m.icpUpsert },
    brandDirective: { deleteMany: m.directiveDeleteMany, createMany: m.directiveCreateMany },
    clientChannel: { upsert: m.channelUpsert },
  },
}));
vi.mock("@/lib/tenant", () => ({
  requireTenantAccess: m.requireTenantAccess,
  isPlaceholderTenantName: (n: string | null | undefined) => !n?.trim() || /'s Workspace$/.test(n.trim()),
}));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/onboardingGuard", () => ({ refuseOnboardingOverwrite: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/icpDirective", () => ({ syncIcpDirective: m.syncIcpDirective }));

const route = await import("@/app/api/onboarding/setup/route");

const audience = "Founders of seed-stage SaaS companies who are adding AI to their product.";
const req = (body: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  m.requireTenantAccess.mockResolvedValue({ clientId: "c1" });
  m.auth.mockResolvedValue({ user: { name: "Jordan Lee", image: null } });
  m.clientFind.mockResolvedValue({ name: "jordan's Workspace" });
  m.profileFind.mockResolvedValue(null);
});

describe("POST /api/onboarding/setup", () => {
  it("makes the audience answer the ideal customer, as written", async () => {
    const res = await route.POST(req({ industry: "General Business", icp_description: audience, channels: ["linkedin"] }));
    expect(res.status).toBe(200);
    expect(m.icpUpsert).toHaveBeenCalledWith(expect.objectContaining({ update: { who: audience } }));
    expect(m.syncIcpDirective).toHaveBeenCalledWith("c1", expect.objectContaining({ who: audience }));
  });

  it("does not copy the brand name into a directive", async () => {
    await route.POST(req({ industry: "General Business", icp_description: audience, content_focus: "Practical AI" }));
    const rows = m.directiveCreateMany.mock.calls[0][0].data as { ruleKey: string }[];
    expect(rows.map((r) => r.ruleKey)).toEqual(["content_focus"]);
  });
});
