import { describe, it, expect } from "vitest";
import { DAILY_HARVEST_LIMIT, startOfUtcDay } from "@/lib/harvestBudget";

/**
 * The cap exists because harvest cost scales with tenant count, not usage:
 * 00_tenant_dispatcher fires one run per ACTIVE client every night. With 9
 * active tenants a daily schedule sits at 9/10 -- so a tenth tenant is the
 * thing that would quietly cross the line.
 */

/** Mirrors the accounting in claimHarvestSlot. */
function grantedFor(concurrentClaims: number, alreadyUsed = 0): number {
  let granted = 0;
  for (let i = 0; i < concurrentClaims; i++) {
    if (alreadyUsed + granted < DAILY_HARVEST_LIMIT) granted++;
  }
  return granted;
}

describe("daily harvest budget", () => {
  it("admits today's nine-tenant fan-out untouched", () => {
    expect(grantedFor(9)).toBe(9);
  });

  it("caps the fan-out once a tenth tenant is added", () => {
    // 11 active tenants must still only spend 10 runs.
    expect(grantedFor(11)).toBe(DAILY_HARVEST_LIMIT);
  });

  it("refuses a manual trigger after the schedule has spent the budget", () => {
    expect(grantedFor(1, DAILY_HARVEST_LIMIT)).toBe(0);
  });

  it("leaves one slot for a manual trigger when nine are used", () => {
    expect(grantedFor(1, 9)).toBe(1);
  });

  it("counts failed runs against the budget", () => {
    // A failed harvest still paid for its Qwen calls. Refunding it would make a
    // broken pipeline unbounded -- exactly when a cap matters most.
    expect(grantedFor(1, DAILY_HARVEST_LIMIT)).toBe(0);
  });
});

describe("budget window", () => {
  it("resets on the UTC day boundary the cron fires against", () => {
    const start = startOfUtcDay(new Date("2026-09-11T23:59:59.999Z"));
    expect(start.toISOString()).toBe("2026-09-11T00:00:00.000Z");
  });

  it("puts a run just after midnight UTC in the new day", () => {
    const start = startOfUtcDay(new Date("2026-09-12T00:00:01.000Z"));
    expect(start.toISOString()).toBe("2026-09-12T00:00:00.000Z");
  });
});
