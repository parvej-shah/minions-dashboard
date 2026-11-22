import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindMany = vi.fn();
const scheduleFindUnique = vi.fn();
const clientFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { asset: { findMany: assetFindMany }, postingSchedule: { findUnique: scheduleFindUnique }, client: { findUnique: clientFindUnique } },
}));

const { resolveFreeTime } = await import("./slotBooking");

const NOW = new Date("2026-11-22T12:00:00Z");
const schedule = { isActive: true, cadenceType: "DAILY", intervalDays: null, daysOfWeek: [], timesOfDay: ["21:00"], requireReview: false };
const day = (n: number) => new Date(`2026-11-${n}T15:00:00Z`); // 21:00 Dhaka

beforeEach(() => {
  vi.clearAllMocks();
  scheduleFindUnique.mockResolvedValue(schedule);
  clientFindUnique.mockResolvedValue({ timezone: "Asia/Dhaka" });
  assetFindMany.mockResolvedValue([]);
});

describe("one post per posting time (task 125)", () => {
  it("keeps the wanted time when nothing holds it", async () => {
    expect(await resolveFreeTime("c1", day(23), "a1", NOW)).toEqual(day(23));
  });

  it("moves to the next free posting time when another post holds it", async () => {
    assetFindMany.mockResolvedValue([{ scheduledFor: day(23) }, { scheduledFor: day(24) }]);
    expect(await resolveFreeTime("c1", day(23), "a1", NOW)).toEqual(day(25));
  });

  it("does not count the post being moved", async () => {
    await resolveFreeTime("c1", day(23), "a1", NOW);
    expect(assetFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: { not: "a1" }, status: "SCHEDULED" }) }));
  });
});
