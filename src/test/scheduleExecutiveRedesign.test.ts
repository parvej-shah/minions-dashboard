import { describe, it, expect } from "vitest";
import {
  determineRhythmPreset,
  applyRhythmPreset,
  TIME_PRESETS,
  formatForecastSlot,
  type PublishingMode,
  modeFromRequireReview,
  requireReviewFromMode,
} from "@/lib/schedule/executivePace";

describe("Executive Publishing Pace & Schedule (Task 74)", () => {
  describe("Rhythm Presets", () => {
    it("identifies 3x a week (Mon, Wed, Fri) preset correctly", () => {
      const preset = determineRhythmPreset("DAYS_OF_WEEK", [1, 3, 5]);
      expect(preset).toBe("THREE_TIMES_A_WEEK");
    });

    it("identifies Weekdays (Mon-Fri) preset correctly", () => {
      const preset = determineRhythmPreset("DAYS_OF_WEEK", [1, 2, 3, 4, 5]);
      expect(preset).toBe("WEEKDAYS");
    });

    it("identifies Custom preset for other day selections", () => {
      expect(determineRhythmPreset("DAYS_OF_WEEK", [2, 4])).toBe("CUSTOM");
      expect(determineRhythmPreset("DAYS_OF_WEEK", [0, 6])).toBe("CUSTOM");
      expect(determineRhythmPreset("EVERY_N_DAYS", [])).toBe("CUSTOM");
    });

    it("applies THREE_TIMES_A_WEEK preset to payload", () => {
      const result = applyRhythmPreset("THREE_TIMES_A_WEEK");
      expect(result.cadence_type).toBe("DAYS_OF_WEEK");
      expect(result.days_of_week).toEqual([1, 3, 5]);
    });

    it("applies WEEKDAYS preset to payload", () => {
      const result = applyRhythmPreset("WEEKDAYS");
      expect(result.cadence_type).toBe("DAYS_OF_WEEK");
      expect(result.days_of_week).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("Publishing Control (Review First vs Autopilot)", () => {
    it("maps require_review=true to affirmative REVIEW_FIRST mode", () => {
      const mode: PublishingMode = modeFromRequireReview(true);
      expect(mode).toBe("REVIEW_FIRST");
    });

    it("maps require_review=false to affirmative AUTOPILOT mode", () => {
      const mode: PublishingMode = modeFromRequireReview(false);
      expect(mode).toBe("AUTOPILOT");
    });

    it("maps REVIEW_FIRST back to require_review=true", () => {
      expect(requireReviewFromMode("REVIEW_FIRST")).toBe(true);
    });

    it("maps AUTOPILOT back to require_review=false", () => {
      expect(requireReviewFromMode("AUTOPILOT")).toBe(false);
    });
  });

  describe("Calibrated Time Presets", () => {
    it("provides standard executive time slots", () => {
      expect(TIME_PRESETS.map((p) => p.time)).toEqual(["09:00", "12:30", "18:00"]);
      expect(TIME_PRESETS[0].label).toContain("Morning");
      expect(TIME_PRESETS[1].label).toContain("Midday");
      expect(TIME_PRESETS[2].label).toContain("Evening");
    });
  });

  describe("Calm Executive Forecast (Zero Jargon)", () => {
    it("formats drafted slots cleanly without algorithmic jargon", () => {
      const formatted = formatForecastSlot({
        status: "DRAFTED",
        idea_title: "Why our CRM summaries became booking confirmations",
        slot_at: "2026-11-13T15:00:00.000Z",
        lane_name: "Authority",
        fill_method: "BELOW_BAR",
        asset_id: "asset-123",
      }, "Asia/Dhaka");

      expect(formatted.statusLabel).toBe("Ready for review");
      expect(formatted.title).toBe("Why our CRM summaries became booking confirmations");
      // Must not contain developer/algorithmic jargon
      expect(formatted.rawJargon).toBeUndefined();
      expect(formatted.statusLabel).not.toContain("BELOW_BAR");
      expect(formatted.statusLabel).not.toContain("LANE");
    });

    it("formats scheduled future slots calmly", () => {
      const formatted = formatForecastSlot({
        status: "PLANNED",
        idea_title: "The 1.8-second rule for AI voice agents",
        slot_at: "2026-11-16T03:00:00.000Z",
        lane_name: "Authority",
        fill_method: "LANE",
        asset_id: null,
      }, "Asia/Dhaka");

      expect(formatted.statusLabel).toBe("Scheduled to draft");
      expect(formatted.title).toBe("The 1.8-second rule for AI voice agents");
    });
  });
});
