import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { jobState } = await import("./jobHeartbeat");

const now = new Date("2026-09-28T10:00:00Z");
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe("whether a job is running", () => {
  it("is running while its last check-in is within three of its intervals", () => {
    expect(jobState({ everyMinutes: 5 }, minsAgo(4), now)).toBe("RUNNING");
    expect(jobState({ everyMinutes: 5 }, minsAgo(15), now)).toBe("RUNNING");
    expect(jobState({ everyMinutes: 5 }, minsAgo(16), now)).toBe("STOPPED");
    expect(jobState({ everyMinutes: 24 * 60 }, minsAgo(25 * 60), now)).toBe("RUNNING");
  });

  it("is stopped when it has never checked in", () => {
    expect(jobState({ everyMinutes: 5 }, null, now)).toBe("STOPPED");
  });

  it("is on demand when it only runs when called", () => {
    expect(jobState({ everyMinutes: null }, null, now)).toBe("ON_DEMAND");
  });
});
