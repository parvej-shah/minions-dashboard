import { describe, expect, it } from "vitest";
import { autopilotOffered, slotsToDraftNow } from "./ahead";

const now = new Date("2026-11-20T09:00:00Z");
const hoursOut = (h: number) => new Date(now.getTime() + h * 3_600_000);

describe("slotsToDraftNow", () => {
  it("drafts a slot 24 hours out, not one at 25", () => {
    expect(slotsToDraftNow([hoursOut(24)], now)).toHaveLength(1);
    expect(slotsToDraftNow([hoursOut(25)], now)).toHaveLength(0);
  });
  it("skips slots already handled, so a later tick does not draft twice", () => {
    const s = hoursOut(10);
    expect(slotsToDraftNow([s], now, new Set([s.getTime()]))).toHaveLength(0);
  });
  it("ignores slots in the past and returns the rest soonest first", () => {
    const out = slotsToDraftNow([hoursOut(20), hoursOut(-1), hoursOut(5)], now);
    expect(out.map((d) => d.getTime())).toEqual([hoursOut(5).getTime(), hoursOut(20).getTime()]);
  });
});

describe("slotsToDraftNow with a longer window or a minimum count (task 121)", () => {
  it("drafts a slot 5 days out with a 168 hour lead", () => {
    expect(slotsToDraftNow([hoursOut(120)], now, new Set(), { leadHours: 168 })).toHaveLength(1);
    expect(slotsToDraftNow([hoursOut(170)], now, new Set(), { leadHours: 168 })).toHaveLength(0);
  });
  it("drafts the next N slots even beyond the lead window", () => {
    const slots = [hoursOut(10), hoursOut(60), hoursOut(110), hoursOut(160)];
    expect(slotsToDraftNow(slots, now, new Set(), { leadHours: 24, minSlots: 3 })).toHaveLength(3);
  });
  it("counts handled slots toward the minimum, so the buffer does not grow every tick", () => {
    const slots = [hoursOut(10), hoursOut(60), hoursOut(110), hoursOut(160)];
    const handled = new Set([slots[0].getTime(), slots[1].getTime()]);
    expect(slotsToDraftNow(slots, now, handled, { leadHours: 24, minSlots: 3 }).map((d) => d.getTime())).toEqual([slots[2].getTime()]);
  });
});

describe("autopilotOffered", () => {
  it("offers Autopilot to a Review-first workspace after a week", () => {
    expect(autopilotOffered(hoursOut(-24 * 7), true, now)).toBe(true);
    expect(autopilotOffered(hoursOut(-24 * 6), true, now)).toBe(false);
  });
  it("never offers it when Autopilot is already on", () => {
    expect(autopilotOffered(hoursOut(-24 * 30), false, now)).toBe(false);
  });
});
