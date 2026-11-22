import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindUnique = vi.fn();
const assetUpdate = vi.fn();
const assetUpdateMany = vi.fn();
const slotFindFirst = vi.fn();
const slotFindMany = vi.fn();
const assetFindFirst = vi.fn();
const slotUpdate = vi.fn();
const scheduleFindUnique = vi.fn();
const syncAssetToBlog = vi.fn();
const triggerN8nWorkflow = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    asset: { findFirst: assetFindFirst, findUnique: assetFindUnique, update: assetUpdate, updateMany: assetUpdateMany },
    scheduleSlot: { findFirst: slotFindFirst, findMany: slotFindMany, update: slotUpdate },
    postingSchedule: { findUnique: scheduleFindUnique },
  },
}));
vi.mock("@/services/publishing", () => ({ syncAssetToBlog }));
vi.mock("@/services/pipeline", () => ({ triggerN8nWorkflow }));
const getLinkedInHealth = vi.fn();
vi.mock("@/services/linkedinHealth", () => ({ getLinkedInHealth }));
vi.mock("@/services/harvestRun", () => ({ startHarvest: vi.fn() }));

const { onSlotDraftReady, harvestFocusLane, upcomingPlanSlots, settleDraftingSlots } = await import("./contentPlan");

const draft = { id: "a1", clientId: "c1", ideaId: "i1", status: "PENDING_REVIEW", claimsOk: "Y", heroStatus: "READY", reviewNotes: ["Reads at grade 9"] };
const slotAt = new Date("2099-01-01T09:00:00Z");
const slot = { id: "s1", status: "DRAFTING", assetId: null, fillMethod: "LANE", gateReasons: [] as string[], slotAt };

beforeEach(() => {
  vi.clearAllMocks();
  assetFindUnique.mockResolvedValue(draft);
  slotFindFirst.mockResolvedValue(slot);
  scheduleFindUnique.mockResolvedValue({ requireReview: false });
  getLinkedInHealth.mockResolvedValue("connected");
  assetUpdateMany.mockResolvedValue({ count: 1 });
  triggerN8nWorkflow.mockResolvedValue({ result: { success: true }, status: 200 });
});

describe("a slot's draft once its cover is settled", () => {
  it("leaves a draft started by hand alone", async () => {
    slotFindFirst.mockResolvedValue(null);
    expect(await onSlotDraftReady("a1")).toBe("NOT_A_SLOT");
    expect(assetUpdateMany).not.toHaveBeenCalled();
  });

  it("labels a below-bar draft and holds it on Review first (D17)", async () => {
    scheduleFindUnique.mockResolvedValue({ requireReview: true });
    slotFindFirst.mockResolvedValue({ ...slot, fillMethod: "BELOW_BAR", gateReasons: ["no author advantage"] });
    expect(await onSlotDraftReady("a1")).toBe("LABELLED");
    expect(assetUpdate).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { reviewNotes: [expect.stringMatching(/^Below the usual bar: no author advantage\./), "Reads at grade 9"] },
    });
    expect(assetUpdateMany).not.toHaveBeenCalled();
    expect(slotUpdate).toHaveBeenCalledWith({ where: { id: "s1" }, data: { assetId: "a1", status: "DRAFTED" } });
  });

  it("schedules a passing Autopilot draft at the slot's time, without publishing now", async () => {
    expect(await onSlotDraftReady("a1")).toBe("SCHEDULED");
    expect(assetUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "a1", status: "PENDING_REVIEW" }, data: expect.objectContaining({ status: "SCHEDULED", scheduledFor: slotAt }) })
    );
    expect(syncAssetToBlog).not.toHaveBeenCalled();
    expect(triggerN8nWorkflow).not.toHaveBeenCalled();
  });

  it("schedules a draft whose slot has already passed for now", async () => {
    slotFindFirst.mockResolvedValue({ ...slot, slotAt: new Date("2000-01-01T09:00:00Z") });
    expect(await onSlotDraftReady("a1")).toBe("SCHEDULED");
    const data = assetUpdateMany.mock.calls[0][0].data;
    expect(data.scheduledFor.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it("holds a passing Autopilot draft for review when LinkedIn is not working", async () => {
    for (const health of ["missing", "expired"]) {
      getLinkedInHealth.mockResolvedValue(health);
      expect(await onSlotDraftReady("a1")).toBe("HELD");
    }
    expect(assetUpdateMany).not.toHaveBeenCalled();
  });

  it("holds it when review is required", async () => {
    scheduleFindUnique.mockResolvedValue({ requireReview: true });
    expect(await onSlotDraftReady("a1")).toBe("HELD");
    expect(assetUpdateMany).not.toHaveBeenCalled();
  });

  it("Autopilot schedules whatever the checks say (task 121)", async () => {
    assetFindUnique.mockResolvedValue({ ...draft, claimsOk: "BLOCKED" });
    expect(await onSlotDraftReady("a1")).toBe("SCHEDULED");
    assetFindUnique.mockResolvedValue({ ...draft, heroStatus: "FAILED" });
    expect(await onSlotDraftReady("a1")).toBe("SCHEDULED");
    slotFindFirst.mockResolvedValue({ ...slot, fillMethod: "BELOW_BAR", gateReasons: ["no author advantage"] });
    assetFindUnique.mockResolvedValue(draft);
    expect(await onSlotDraftReady("a1")).toBe("SCHEDULED");
    expect(assetUpdateMany).toHaveBeenCalledTimes(3);
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

describe("a slot whose draft never started (task 124)", () => {
  const now = new Date("2099-01-01T08:00:00Z");
  const stuck = (over: object = {}) => ({ id: "s1", ideaId: "i1", status: "DRAFTING", note: null, slotAt, updatedAt: new Date(now.getTime() - 31 * 60_000), ...over });

  it("gives a future slot one more try instead of leaving it empty", async () => {
    slotFindMany.mockResolvedValue([stuck()]);
    assetFindFirst.mockResolvedValue(null);
    await settleDraftingSlots("c1", now);
    expect(slotUpdate).toHaveBeenCalledWith({ where: { id: "s1" }, data: expect.objectContaining({ status: "PLANNED", ideaId: null, note: expect.stringMatching(/^Retrying/) }) });
  });

  it("gives up after the retry", async () => {
    slotFindMany.mockResolvedValue([stuck({ note: "Retrying: the first draft did not start." })]);
    assetFindFirst.mockResolvedValue(null);
    await settleDraftingSlots("c1", now);
    expect(slotUpdate).toHaveBeenCalledWith({ where: { id: "s1" }, data: expect.objectContaining({ status: "EMPTY" }) });
  });

  it("gives up on a slot whose time has passed", async () => {
    slotFindMany.mockResolvedValue([stuck({ slotAt: new Date(now.getTime() - 3_600_000) })]);
    assetFindFirst.mockResolvedValue(null);
    await settleDraftingSlots("c1", now);
    expect(slotUpdate).toHaveBeenCalledWith({ where: { id: "s1" }, data: expect.objectContaining({ status: "EMPTY" }) });
  });

  it("waits while the draft is still starting", async () => {
    slotFindMany.mockResolvedValue([stuck({ updatedAt: new Date(now.getTime() - 5 * 60_000) })]);
    assetFindFirst.mockResolvedValue(null);
    await settleDraftingSlots("c1", now);
    expect(slotUpdate).not.toHaveBeenCalled();
  });
});
