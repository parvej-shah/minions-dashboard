import { describe, expect, it } from "vitest";
import { nextFreeSlot } from "./nextSlot";

const NOW = Date.parse("2026-11-09T02:30:00Z");

describe("nextFreeSlot", () => {
  const slots = ["2026-11-09T02:40:00Z", "2026-11-11T03:00:00Z", "2026-11-13T03:00:00Z"];

  it("skips slots too close to now and slots another post already holds", () => {
    expect(nextFreeSlot(slots, ["2026-11-11T03:00:00.000Z"], NOW, 30)).toBe("2026-11-13T03:00:00Z");
  });

  it("takes the first slot far enough ahead", () => {
    expect(nextFreeSlot(slots, [], NOW, 30)).toBe("2026-11-11T03:00:00Z");
    expect(nextFreeSlot(slots, [], NOW, 5)).toBe("2026-11-09T02:40:00Z");
  });

  it("is null when nothing is free", () => {
    expect(nextFreeSlot([], [], NOW, 30)).toBeNull();
  });
});
