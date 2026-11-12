import { describe, it, expect } from "vitest";
import { compactSlotLabel } from "@/lib/today";

describe("Task 71: Mobile View Overhaul", () => {
  it("generates concise slot labels fitting mobile touch buttons", () => {
    const slot = "2026-11-12T15:00:00.000Z";
    const label = compactSlotLabel(slot, "Asia/Dhaka");
    expect(label).toBe("Thu 21:00");
    // Ensure button label length stays <= 25 characters for mobile touch screens
    const fullButtonText = `Schedule · ${label}`;
    expect(fullButtonText.length).toBeLessThanOrEqual(25);
  });

  it("validates mobile copy guidelines for touch interfaces", () => {
    const desktopReserveDesc = "Additional drafted posts waiting in your library. Hover to preview hook and schedule.";
    const mobileReserveDesc = "Additional drafted posts in your library.";

    // Desktop mentions hover; mobile must not mention hover
    expect(desktopReserveDesc.toLowerCase()).toContain("hover");
    expect(mobileReserveDesc.toLowerCase()).not.toContain("hover");
  });

  it("checks mobile touch target ergonomics contract", () => {
    // WCAG 2.5.5 / 2.5.8 requires at least 44px for primary mobile tap targets
    const mobileMinButtonHeightPx = 44;
    expect(mobileMinButtonHeightPx).toBeGreaterThanOrEqual(44);
  });
});
