import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatDate, formatDateTime, formatRelativeTime, formatTime } from "./date";

// Pretend the viewer is in New York; the app must still show Dhaka time.
process.env.TZ = "America/New_York";

// 2026-11-17 20:30 UTC is 2026-11-18 02:30 in Dhaka (UTC+6): the day differs too.
const ISO = "2026-11-17T20:30:00Z";

describe("dates show Bangladesh time for everyone", () => {
  it("formatTime", () => expect(formatTime(ISO)).toMatch(/02:30/));
  it("formatDate", () => expect(formatDate(ISO)).toBe("Nov 18, 2026"));
  it("formatDateTime", () => expect(formatDateTime(ISO)).toMatch(/Nov 18, 2026.*02:30/));
  it("formatRelativeTime past a month", () => expect(formatRelativeTime("2025-01-31T20:00:00Z")).toBe("Feb 1"));
  it("first-post time and pulse card do not use the browser's zone", () => {
    const first = readFileSync(path.resolve(__dirname, "../app/(onboarding)/onboarding/first-post/_components/FirstPost.tsx"), "utf8");
    expect(first).toMatch(/timeZone: DEFAULT_TIMEZONE/);
    const pulse = readFileSync(path.resolve(__dirname, "../components/pulse/WeeklyPulseCard.tsx"), "utf8");
    expect(pulse).not.toMatch(/resolvedOptions\(\)\.timeZone/);
  });
});
