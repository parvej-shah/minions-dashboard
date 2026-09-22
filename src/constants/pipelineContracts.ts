/**
 * Values n8n sends to the dashboard. The routes validate against these, and
 * the n8n contract tests (src/test/n8n) check every workflow emits only these,
 * so a status added on one side cannot be forgotten on the other.
 */

/** hero_status values 04_hero_image may attach via /api/internal/assets/hero. */
export const TERMINAL_HERO_STATUSES = ["READY", "BLOCKED_BY_SAFETY", "FAILED"] as const;
export type TerminalHeroStatus = (typeof TERMINAL_HERO_STATUSES)[number];

/** status values a run callback may PATCH to /api/pipeline/runs/[id]. */
export const RUN_CALLBACK_STATUSES = ["RUNNING", "COMPLETED", "FAILED"] as const;
