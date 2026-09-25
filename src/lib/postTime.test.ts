import { describe, expect, it } from "vitest";
import { checkScheduleTime, formatPostTime, utcToZoned, zonedToUtc } from "./postTime";

const NY = "America/New_York";

describe("a local date and time becomes the right instant", () => {
  it("reads the time in the workspace's timezone, DST included", () => {
    expect(zonedToUtc("2026-09-28", "09:00", NY)?.toISOString()).toBe("2026-09-28T13:00:00.000Z"); // EDT
    expect(zonedToUtc("2026-12-01", "09:00", NY)?.toISOString()).toBe("2026-12-01T14:00:00.000Z"); // EST
    expect(zonedToUtc("2026-09-28", "09:00", "Asia/Dhaka")?.toISOString()).toBe("2026-09-28T03:00:00.000Z");
  });

  it("refuses a time that does not exist and malformed input", () => {
    expect(zonedToUtc("2027-03-14", "02:30", NY)).toBeNull(); // clocks jump 02:00 -> 03:00
    expect(zonedToUtc("2026-02-30", "09:00", NY)).toBeNull();
    expect(zonedToUtc("2026-9-28", "9:00", NY)).toBeNull();
  });

  it("round-trips", () => {
    const at = zonedToUtc("2026-11-01", "23:45", NY)!;
    expect(utcToZoned(at, NY)).toEqual({ date: "2026-11-01", time: "23:45" });
    expect(formatPostTime(at, NY)).toBe("Sun, Nov 1, 11:45 PM");
  });
});

describe("what a reviewer may schedule", () => {
  const now = new Date("2026-09-25T13:00:00Z"); // 09:00 in New York

  it("needs at least ten minutes' lead and at most 180 days", () => {
    expect(checkScheduleTime("2026-09-25", "09:05", NY, now)).toMatchObject({ ok: false });
    expect(checkScheduleTime("2026-09-25", "09:10", NY, now)).toMatchObject({ ok: true });
    expect(checkScheduleTime("2026-09-24", "09:00", NY, now)).toMatchObject({ ok: false });
    expect(checkScheduleTime("2027-06-01", "09:00", NY, now)).toMatchObject({ ok: false });
    expect(checkScheduleTime("2026-10-01", "08:30", NY, now)).toEqual({ ok: true, at: new Date("2026-10-01T12:30:00Z") });
  });
});
