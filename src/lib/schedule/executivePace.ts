import { formatPostTime } from "@/lib/postTime";

export type RhythmPresetKey = "THREE_TIMES_A_WEEK" | "WEEKDAYS" | "CUSTOM";

export interface RhythmPreset {
  key: RhythmPresetKey;
  label: string;
  badge?: string;
  subtitle: string;
  days: number[];
}

export const RHYTHM_PRESETS: Record<RhythmPresetKey, RhythmPreset> = {
  THREE_TIMES_A_WEEK: {
    key: "THREE_TIMES_A_WEEK",
    label: "3 times a week",
    badge: "Recommended",
    subtitle: "Mon, Wed, Fri · Steady authority",
    days: [1, 3, 5],
  },
  WEEKDAYS: {
    key: "WEEKDAYS",
    label: "Every weekday",
    badge: "High growth",
    subtitle: "Mon–Fri · Maximum reach",
    days: [1, 2, 3, 4, 5],
  },
  CUSTOM: {
    key: "CUSTOM",
    label: "Custom days",
    subtitle: "Choose your own schedule",
    days: [],
  },
};

export function determineRhythmPreset(cadenceType: string, daysOfWeek: number[]): RhythmPresetKey {
  if (cadenceType === "DAILY") {
    return "WEEKDAYS";
  }
  if (cadenceType === "DAYS_OF_WEEK") {
    const sorted = [...daysOfWeek].sort((a, b) => a - b);
    if (sorted.length === 3 && sorted[0] === 1 && sorted[1] === 3 && sorted[2] === 5) {
      return "THREE_TIMES_A_WEEK";
    }
    if (sorted.length === 5 && sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3 && sorted[3] === 4 && sorted[4] === 5) {
      return "WEEKDAYS";
    }
  }
  return "CUSTOM";
}

export function applyRhythmPreset(preset: RhythmPresetKey): { cadence_type: "DAYS_OF_WEEK"; days_of_week: number[] } {
  switch (preset) {
    case "THREE_TIMES_A_WEEK":
      return { cadence_type: "DAYS_OF_WEEK", days_of_week: [1, 3, 5] };
    case "WEEKDAYS":
      return { cadence_type: "DAYS_OF_WEEK", days_of_week: [1, 2, 3, 4, 5] };
    case "CUSTOM":
      return { cadence_type: "DAYS_OF_WEEK", days_of_week: [1, 3, 5] };
  }
}

export interface TimePreset {
  time: string;
  label: string;
}

export const TIME_PRESETS: TimePreset[] = [
  { time: "09:00", label: "09:00 AM · Morning" },
  { time: "12:30", label: "12:30 PM · Midday" },
  { time: "18:00", label: "06:00 PM · Evening" },
];

export type PublishingMode = "REVIEW_FIRST" | "AUTOPILOT";

export function modeFromRequireReview(requireReview: boolean): PublishingMode {
  return requireReview ? "REVIEW_FIRST" : "AUTOPILOT";
}

export function requireReviewFromMode(mode: PublishingMode): boolean {
  return mode === "REVIEW_FIRST";
}

export interface ForecastSlotInput {
  status: string;
  idea_title: string | null;
  slot_at: string;
  lane_name: string | null;
  fill_method: string | null;
  asset_id: string | null;
}

export interface FormattedForecastSlot {
  timeFormatted: string;
  title: string;
  statusLabel: string;
  isReady: boolean;
  assetId: string | null;
  rawJargon?: undefined;
}

export function formatForecastSlot(slot: ForecastSlotInput, timezone: string): FormattedForecastSlot {
  const timeFormatted = formatPostTime(slot.slot_at, timezone);
  const title = slot.idea_title || "Draft topic being prepared";
  
  let statusLabel = "Scheduled to draft";
  let isReady = false;

  if (slot.status === "DRAFTED" && slot.asset_id) {
    statusLabel = "Ready for review";
    isReady = true;
  } else if (slot.status === "DRAFTING") {
    statusLabel = "Drafting now";
  } else if (slot.status === "HARVESTING" || slot.status === "NEEDS_IDEAS") {
    statusLabel = "Gathering fresh ideas";
  }

  return {
    timeFormatted,
    title,
    statusLabel,
    isReady,
    assetId: slot.asset_id,
  };
}
