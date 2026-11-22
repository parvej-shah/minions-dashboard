import { beforeEach, describe, expect, it, vi } from "vitest";

const scheduleFindMany = vi.fn();
const slotFindMany = vi.fn();
const assetCount = vi.fn();
const assetFindMany = vi.fn();
const planAhead = vi.fn();
const fillDueSlot = vi.fn();
const upcomingPlanSlots = vi.fn();
const onSlotDraftReady = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { postingSchedule: { findMany: scheduleFindMany }, scheduleSlot: { findMany: slotFindMany }, asset: { count: assetCount, findMany: assetFindMany } },
}));
vi.mock("@/services/contentPlan", () => ({ planAhead, fillDueSlot, upcomingPlanSlots, onSlotDraftReady }));
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
  assetFindMany.mockResolvedValue([]);
  onSlotDraftReady.mockResolvedValue("SCHEDULED");
  upcomingPlanSlots.mockReturnValue([hours(10), hours(30)]);
  fillDueSlot.mockResolvedValue({ slot_id: "s1", idea_id: "i1", method: "LANE" });
});

describe("drafting a day ahead", () => {
  it("Review first keeps the next 3 slots drafted, marked ahead", async () => {
    scheduleFindMany.mockResolvedValue([schedule(true)]);
    upcomingPlanSlots.mockReturnValue([hours(10), hours(60), hours(110), hours(150)]);
    const { due_tenants } = await findDueTenants(now);
    expect(due_tenants).toHaveLength(3);
    expect(fillDueSlot).toHaveBeenCalledWith("c1", hours(10), now, { ahead: true });
    expect(fillDueSlot).not.toHaveBeenCalledWith("c1", hours(150), now, expect.anything());
  });

  it("Autopilot drafts every slot in the next 3 days (task 121)", async () => {
    scheduleFindMany.mockResolvedValue([schedule(false)]);
    upcomingPlanSlots.mockReturnValue([hours(10), hours(60), hours(110), hours(150), hours(200)]);
    expect((await findDueTenants(now)).due_tenants).toHaveLength(2);
  });

  it("skips a slot already drafted by an earlier tick", async () => {
    scheduleFindMany.mockResolvedValue([schedule(true)]);
    upcomingPlanSlots.mockReturnValue([hours(10)]);
    slotFindMany.mockResolvedValue([{ slotAt: hours(10) }]);
    expect((await findDueTenants(now)).due_tenants).toHaveLength(0);
    expect(fillDueSlot).not.toHaveBeenCalled();
  });
});

describe("Autopilot catches up a slot the scheduler missed (task 124)", () => {
  it("drafts a planned slot from the last hours, marked ahead so only passing ideas are used", async () => {
    scheduleFindMany.mockResolvedValue([schedule(false)]);
    upcomingPlanSlots.mockReturnValue([]);
    slotFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ slotAt: hours(-2) }]);
    const { due_tenants } = await findDueTenants(now);
    expect(fillDueSlot).toHaveBeenCalledWith("c1", hours(-2), now, { ahead: true });
    expect(due_tenants).toHaveLength(1);
  });

  it("Review first does not catch up a past slot", async () => {
    scheduleFindMany.mockResolvedValue([schedule(true)]);
    upcomingPlanSlots.mockReturnValue([]);
    slotFindMany.mockResolvedValue([{ slotAt: hours(-2) }]);
    await findDueTenants(now);
    expect(fillDueSlot).not.toHaveBeenCalled();
  });
});

describe("Autopilot sweeps drafts that are waiting (task 121)", () => {
  it("schedules a drafted slot's post that an earlier rule held", async () => {
    scheduleFindMany.mockResolvedValue([schedule(false)]);
    upcomingPlanSlots.mockReturnValue([]);
    slotFindMany.mockResolvedValueOnce([{ assetId: "a9" }]);
    assetFindMany.mockResolvedValue([{ id: "a9" }]);
    await findDueTenants(now);
    expect(onSlotDraftReady).toHaveBeenCalledWith("a9");
  });

  it("leaves Review first alone", async () => {
    scheduleFindMany.mockResolvedValue([schedule(true)]);
    upcomingPlanSlots.mockReturnValue([]);
    await findDueTenants(now);
    expect(slotFindMany).not.toHaveBeenCalledWith(expect.objectContaining({ select: { assetId: true } }));
    expect(onSlotDraftReady).not.toHaveBeenCalled();
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
    expect((await findDueTenants(now)).due_tenants).toHaveLength(2);
  });
});
