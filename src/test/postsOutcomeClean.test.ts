import { describe, expect, it } from "vitest";
import { compactSlotLabel } from "@/lib/today";

const TZ = "Asia/Dhaka"; // UTC+6

describe("Posts Outcome-Based Clean UX (Task 68)", () => {
  it("compactSlotLabel returns a short, non-wrapping slot label like 'Thu 21:00'", () => {
    const slot = "2026-11-12T15:00:00.000Z"; // 21:00 in Dhaka (UTC+6)
    const label = compactSlotLabel(slot, TZ);
    expect(label).toBe("Thu 21:00");
    expect(label.length).toBeLessThan(15);
  });
});
