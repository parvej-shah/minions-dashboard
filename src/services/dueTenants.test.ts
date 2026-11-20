import { beforeEach, describe, expect, it, vi } from "vitest";

const scheduleFindMany = vi.fn();
const slotFindMany = vi.fn();
const assetCount = vi.fn();
const planAhead = vi.fn();
const fillDueSlot = vi.fn();
const upcomingPlanSlots = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { postingSchedule: { findMany: scheduleFindMany }, scheduleSlot: { findMany: slotFindMany }, asset: { count: assetCount } },
}));
vi.mock("@/services/contentPlan", () => ({ planAhead, fillDueSlot, upcomingPlanSlots }));
vi.mock("@/services/quota", () => ({ countAssetsThisMonth: vi.fn().mockResolvedValue(0), monthlyAssetLimit: () => 100, resolvePlan: () => "x" }));
vi.mock("@/services/linkedinHealth", () => ({ checkLinkedInConnection: vi.fn().mockResolvedValue("connected") }));
vi.mock("@/services/postingSchedule", () => ({ toScheduleConfig: () => ({}) }));
vi.mock("@/lib/scheduling", () => ({ computeDueSlot: () => null }));

const { findDueTenants } = await import("./dueTenants");

const now = new Date("2026-11-20T09:00:00Z");
const hours = (h: number) => new Date(now.getTime() + h * 3_600_000);
const schedule = (requireReview: boolean) => ({
  requireReview,
  client: { id: "c1", slug: "c1", timezone: "UTC", assetsPerMonthOverride: null, subscription: null },
});

beforeEach(() => {
  vi.clearAllMocks();
  planAhead.mockResolvedValue({});
  slotFindMany.mockResolvedValue([]);
  assetCount.mockResolvedValue(0);
  upcomingPlanSlots.mockReturnValue([hours(10), hours(30)]);
  fillDueSlot.mockResolvedValue({ slot_id: "s1", idea_id: "i1", method: "LANE" });
});

describe("drafting a day ahead", () => {
  it("drafts only the slot inside the next 24 hours, marked ahead", async () => {
    scheduleFindMany.mockResolvedValue([schedule(true)]);
    const { due_tenants } = await findDueTenants(now);
    expect(due_tenants).toHaveLength(1);
    expect(fillDueSlot).toHaveBeenCalledTimes(1);
    expect(fillDueSlot).toHaveBeenCalledWith("c1", hours(10), now, { ahead: true });
  });

  it("skips a slot already drafted by an earlier tick", async () => {
    scheduleFindMany.mockResolvedValue([schedule(true)]);
    slotFindMany.mockResolvedValue([{ slotAt: hours(10) }]);
    expect((await findDueTenants(now)).due_tenants).toHaveLength(0);
    expect(fillDueSlot).not.toHaveBeenCalled();
  });
});

describe("the unreviewed-draft cap", () => {
  it("blocks Review first at 5 waiting drafts", async () => {
    scheduleFindMany.mockResolvedValue([schedule(true)]);
    assetCount.mockResolvedValue(5);
    expect((await findDueTenants(now)).due_tenants).toHaveLength(0);
  });

  it("does not block Autopilot", async () => {
    scheduleFindMany.mockResolvedValue([schedule(false)]);
    assetCount.mockResolvedValue(5);
    expect((await findDueTenants(now)).due_tenants).toHaveLength(1);
  });
});
