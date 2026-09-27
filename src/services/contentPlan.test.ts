import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindUnique = vi.fn();
const assetUpdate = vi.fn();
const assetUpdateMany = vi.fn();
const slotFindFirst = vi.fn();
const slotUpdate = vi.fn();
const scheduleFindUnique = vi.fn();
const syncAssetToBlog = vi.fn();
const triggerN8nWorkflow = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    asset: { findUnique: assetFindUnique, update: assetUpdate, updateMany: assetUpdateMany },
    scheduleSlot: { findFirst: slotFindFirst, update: slotUpdate },
    postingSchedule: { findUnique: scheduleFindUnique },
  },
}));
vi.mock("@/services/publishing", () => ({ syncAssetToBlog }));
vi.mock("@/services/pipeline", () => ({ triggerN8nWorkflow }));
vi.mock("@/services/harvestRun", () => ({ startHarvest: vi.fn() }));

const { onSlotDraftReady, harvestFocusLane, upcomingPlanSlots } = await import("./contentPlan");

const draft = { id: "a1", clientId: "c1", ideaId: "i1", status: "PENDING_REVIEW", claimsOk: "Y", heroStatus: "READY", reviewNotes: ["Reads at grade 9"] };
const slot = { id: "s1", status: "DRAFTING", assetId: null, fillMethod: "LANE", gateReasons: [] as string[] };

beforeEach(() => {
  vi.clearAllMocks();
  assetFindUnique.mockResolvedValue(draft);
  slotFindFirst.mockResolvedValue(slot);
  scheduleFindUnique.mockResolvedValue({ requireReview: false });
  assetUpdateMany.mockResolvedValue({ count: 1 });
  triggerN8nWorkflow.mockResolvedValue({ result: { success: true }, status: 200 });
});

describe("a slot's draft once its cover is settled", () => {
  it("leaves a draft started by hand alone", async () => {
    slotFindFirst.mockResolvedValue(null);
    expect(await onSlotDraftReady("a1")).toBe("NOT_A_SLOT");
    expect(assetUpdateMany).not.toHaveBeenCalled();
  });

  it("labels a below-bar draft and holds it, even with review off (D17)", async () => {
    slotFindFirst.mockResolvedValue({ ...slot, fillMethod: "BELOW_BAR", gateReasons: ["no author advantage"] });
    expect(await onSlotDraftReady("a1")).toBe("LABELLED");
    expect(assetUpdate).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { reviewNotes: [expect.stringMatching(/^Below the usual bar: no author advantage\./), "Reads at grade 9"] },
    });
    expect(assetUpdateMany).not.toHaveBeenCalled();
    expect(slotUpdate).toHaveBeenCalledWith({ where: { id: "s1" }, data: { assetId: "a1", status: "DRAFTED" } });
  });

  it("publishes a passing draft when the workspace does not require review", async () => {
    assetFindUnique.mockResolvedValueOnce(draft).mockResolvedValueOnce({ ...draft, status: "PUBLISHED" });
    expect(await onSlotDraftReady("a1")).toBe("PUBLISHED");
    expect(assetUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "a1", status: "PENDING_REVIEW" }, data: expect.objectContaining({ status: "PUBLISHED" }) }));
    expect(syncAssetToBlog).toHaveBeenCalled();
    expect(triggerN8nWorkflow).toHaveBeenCalledWith("publish", expect.objectContaining({ asset_id: "a1" }), expect.anything());
  });

  it("holds it when review is required, a check failed or the cover is missing", async () => {
    scheduleFindUnique.mockResolvedValue({ requireReview: true });
    expect(await onSlotDraftReady("a1")).toBe("HELD");
    scheduleFindUnique.mockResolvedValue({ requireReview: false });
    assetFindUnique.mockResolvedValue({ ...draft, claimsOk: "BLOCKED" });
    expect(await onSlotDraftReady("a1")).toBe("HELD");
    assetFindUnique.mockResolvedValue({ ...draft, heroStatus: "FAILED" });
    expect(await onSlotDraftReady("a1")).toBe("HELD");
    expect(assetUpdateMany).not.toHaveBeenCalled();
  });
});

describe("a targeted harvest", () => {
  it("focuses the harvester on the waiting slot's lane", async () => {
    slotFindFirst.mockResolvedValue({ laneId: "lane-lessons" });
    expect(await harvestFocusLane("c1")).toBe("lane-lessons");
    expect(slotFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clientId: "c1", status: "HARVESTING" }) }));
  });
});

describe("the look-ahead's slots", () => {
  const schedule = {
    cadenceType: "DAYS_OF_WEEK", intervalDays: null, daysOfWeek: [1, 3, 5], postsPerDay: 1, timesOfDay: ["09:00"],
    isActive: true, lastRunAt: null, createdAt: new Date("2026-01-01T00:00:00Z"), planStartsOn: null, planEndsOn: null,
  } as never;

  it("names the same slots on passes seconds apart, on the whole minute", () => {
    const a = upcomingPlanSlots(schedule, "America/New_York", new Date("2026-09-27T10:00:07.123Z"));
    const b = upcomingPlanSlots(schedule, "America/New_York", new Date("2026-09-27T10:04:51.999Z"));
    expect(a.map((d) => d.toISOString())).toEqual(["2026-09-28T13:00:00.000Z", "2026-09-30T13:00:00.000Z", "2026-10-02T13:00:00.000Z"]);
    expect(b).toEqual(a);
  });

  it("keeps to the plan's dates", () => {
    const ranged = { ...(schedule as object), planStartsOn: new Date("2026-09-29T00:00:00Z"), planEndsOn: new Date("2026-10-01T00:00:00Z") } as never;
    expect(upcomingPlanSlots(ranged, "America/New_York", new Date("2026-09-27T10:00:00Z")).map((d) => d.toISOString())).toEqual(["2026-09-30T13:00:00.000Z"]);
  });
});
