import { describe, expect, it } from "vitest";
import { draftingCardText, quotaState } from "./quota";

const NOW = new Date("2026-11-26T04:00:00Z");

describe("quotaState (task 128)", () => {
  it("is reached when used meets the limit, and resumes on the 1st of next month", () => {
    const q = quotaState(9, 8, NOW);
    expect(q).toMatchObject({ used: 9, limit: 8, limit_reached: true });
    expect(q.resets_at).toBe("2026-12-01T00:00:00.000Z");
  });
  it("is not reached under the limit", () => {
    expect(quotaState(7, 8, NOW).limit_reached).toBe(false);
  });
  it("rolls the year in December", () => {
    expect(quotaState(1, 8, new Date("2026-12-20T00:00:00Z")).resets_at).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("draftingCardText (task 128)", () => {
  const base = { exists: true, drafting_on: true, timezone: "Asia/Dhaka", next_slot_at: "2026-11-26T15:00:00Z" };
  it("says the limit is reached and when drafting resumes", () => {
    const t = draftingCardText({ ...base, quota: quotaState(9, 8, NOW) });
    expect(t.title).toBe("Paused");
    expect(t.detail).toBe("Monthly limit reached (9 of 8). Drafting resumes 1 Dec.");
  });
  it("names the next slot, not a draft, while under the limit", () => {
    const t = draftingCardText({ ...base, quota: quotaState(3, 8, NOW) });
    expect(t.title).toBe("Active");
    expect(t.detail).toMatch(/^Next post slot: /);
  });
  it("keeps the off states", () => {
    expect(draftingCardText({ ...base, drafting_on: false, quota: quotaState(1, 8, NOW) }).title).toBe("Off");
    expect(draftingCardText({ ...base, exists: false, quota: null }).title).toBe("Off");
  });
});
