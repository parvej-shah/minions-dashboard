import { describe, expect, it } from "vitest";
import { computeDueSlot, type PostingScheduleConfig } from "./scheduling";

const TZ = "UTC"; // deterministic: avoids DST edge cases unrelated to what's under test

function makeSchedule(overrides: Partial<PostingScheduleConfig> = {}): PostingScheduleConfig {
  return {
    cadenceType: "DAILY",
    intervalDays: null,
    daysOfWeek: [],
    postsPerDay: 1,
    timesOfDay: ["09:00"],
    isActive: true,
    lastRunAt: null,
    createdAt: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

describe("computeDueSlot", () => {
  it("returns null when the schedule is inactive, even inside the window", () => {
    const schedule = makeSchedule({ isActive: false });
    const now = new Date("2026-08-24T09:02:00Z");
    expect(computeDueSlot(schedule, TZ, now)).toBeNull();
  });

  describe("DAILY cadence", () => {
    it("is due inside the window after the scheduled time", () => {
      const schedule = makeSchedule({ cadenceType: "DAILY", timesOfDay: ["09:00"] });
      const now = new Date("2026-08-24T09:02:00Z");
      const slot = computeDueSlot(schedule, TZ, now, 5);
      expect(slot).not.toBeNull();
      expect(slot?.toISOString()).toBe("2026-08-24T09:00:00.000Z");
    });

    it("is not due before the scheduled time", () => {
      const schedule = makeSchedule({ cadenceType: "DAILY", timesOfDay: ["09:00"] });
      const now = new Date("2026-08-24T08:58:00Z");
      expect(computeDueSlot(schedule, TZ, now, 5)).toBeNull();
    });

    it("is not due once the window has passed", () => {
      const schedule = makeSchedule({ cadenceType: "DAILY", timesOfDay: ["09:00"] });
      const now = new Date("2026-08-24T09:06:00Z");
      expect(computeDueSlot(schedule, TZ, now, 5)).toBeNull();
    });
  });

  describe("EVERY_N_DAYS cadence", () => {
    it("is due on a day that is an exact multiple of the interval since createdAt", () => {
      const schedule = makeSchedule({
        cadenceType: "EVERY_N_DAYS",
        intervalDays: 3,
        timesOfDay: ["09:00"],
        createdAt: new Date("2026-08-21T00:00:00Z"), // +3 days = Aug 24
      });
      const now = new Date("2026-08-24T09:02:00Z");
      expect(computeDueSlot(schedule, TZ, now, 5)).not.toBeNull();
    });

    it("is not due on an off day", () => {
      const schedule = makeSchedule({
        cadenceType: "EVERY_N_DAYS",
        intervalDays: 3,
        timesOfDay: ["09:00"],
        createdAt: new Date("2026-08-21T00:00:00Z"), // Aug 22/23 are off days
      });
      const now = new Date("2026-08-23T09:02:00Z");
      expect(computeDueSlot(schedule, TZ, now, 5)).toBeNull();
    });
  });

  describe("DAYS_OF_WEEK cadence", () => {
    it("is due when today's weekday is in the configured list", () => {
      // 2026-08-24 is a Monday (weekday 1)
      const schedule = makeSchedule({ cadenceType: "DAYS_OF_WEEK", daysOfWeek: [1, 3, 5], timesOfDay: ["09:00"] });
      const now = new Date("2026-08-24T09:02:00Z");
      expect(computeDueSlot(schedule, TZ, now, 5)).not.toBeNull();
    });

    it("is not due when today's weekday is absent from the list", () => {
      // 2026-08-25 is a Tuesday (weekday 2)
      const schedule = makeSchedule({ cadenceType: "DAYS_OF_WEEK", daysOfWeek: [1, 3, 5], timesOfDay: ["09:00"] });
      const now = new Date("2026-08-25T09:02:00Z");
      expect(computeDueSlot(schedule, TZ, now, 5)).toBeNull();
    });
  });

  it("does not refire a slot already covered by lastRunAt (idempotency across dispatcher ticks)", () => {
    const schedule = makeSchedule({
      cadenceType: "DAILY",
      timesOfDay: ["09:00"],
      lastRunAt: new Date("2026-08-24T09:00:00Z"),
    });
    const now = new Date("2026-08-24T09:02:00Z");
    expect(computeDueSlot(schedule, TZ, now, 5)).toBeNull();
  });

  it("fires again the next day even with a lastRunAt from a prior slot", () => {
    const schedule = makeSchedule({
      cadenceType: "DAILY",
      timesOfDay: ["09:00"],
      lastRunAt: new Date("2026-08-23T09:00:00Z"),
    });
    const now = new Date("2026-08-24T09:02:00Z");
    expect(computeDueSlot(schedule, TZ, now, 5)).not.toBeNull();
  });
});
