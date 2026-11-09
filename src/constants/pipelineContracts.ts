/**
 * Values n8n sends to the dashboard. The routes validate against these, and
 * the n8n contract tests (src/test/n8n) check every workflow emits only these,
 * so a status added on one side cannot be forgotten on the other.
 */

/** status values a run callback may PATCH to /api/pipeline/runs/[id]. */
export const RUN_CALLBACK_STATUSES = ["RUNNING", "COMPLETED", "FAILED"] as const;
