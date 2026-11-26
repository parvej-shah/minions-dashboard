import { describe, it, expect } from "vitest";
import { PLANS, findPlan } from "./plans";

describe("plan limits", () => {
  it("allows 30, 45 and 60 posts a month", () => {
    expect(findPlan("starter")?.limits.assetsPerMonth).toBe(30);
    expect(findPlan("growth")?.limits.assetsPerMonth).toBe(45);
    expect(findPlan("scale")?.limits.assetsPerMonth).toBe(60);
  });

  it("rises with each tier", () => {
    const n = PLANS.map((p) => p.limits.assetsPerMonth);
    expect(n).toEqual([...n].sort((a, b) => a - b));
    expect(new Set(n).size).toBe(n.length);
  });
});
