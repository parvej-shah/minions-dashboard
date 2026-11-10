import { describe, expect, it } from "vitest";
import { applyOptimisticSchedule, rollbackSchedule } from "./optimisticSchedule";
import { buttonStyles } from "@/components/ui/Button";
import type { AssetItem } from "@/types";

const mockAsset = {
  id: "asset_test_1",
  title: "Why founders rewrite good code",
  hook: "A compelling hook",
  status: "PENDING_REVIEW",
  scheduled_for: null,
  claims_ok: "N",
} as unknown as AssetItem;

describe("Optimistic Scheduling", () => {
  it("instantly sets status to SCHEDULED and claims_ok to Y with computed ISO date", () => {
    const optimistic = applyOptimisticSchedule(mockAsset, "2026-11-11", "09:00", "Asia/Dhaka");
    expect(optimistic.status).toBe("SCHEDULED");
    expect(optimistic.claims_ok).toBe("Y");
    expect(optimistic.scheduled_for).toBeTruthy();
    // Dhaka is UTC+6, so 09:00 Dhaka = 03:00 UTC
    expect(new Date(optimistic.scheduled_for!).toISOString()).toBe("2026-11-11T03:00:00.000Z");
  });

  it("rolls back cleanly to previous state on failure", () => {
    const optimistic = applyOptimisticSchedule(mockAsset, "2026-11-11", "09:00", "Asia/Dhaka");
    expect(optimistic.status).toBe("SCHEDULED");

    const rolledBack = rollbackSchedule(optimistic, mockAsset);
    expect(rolledBack.status).toBe("PENDING_REVIEW");
    expect(rolledBack.scheduled_for).toBeNull();
    expect(rolledBack.claims_ok).toBe("N");
  });
});

describe("Tactile Button Styling (Apple spring feedback)", () => {
  it("includes active scale press feedback for tactile touch and click", () => {
    const classes = buttonStyles();
    expect(classes).toContain("active:scale-[0.985]");
    expect(classes).toContain("transition-transform");
  });
});
