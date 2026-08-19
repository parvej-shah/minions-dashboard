/**
 * Number formatting shared across the dashboard.
 *
 * Costs were previously printed with `.toFixed(3)` in some places and
 * `.toFixed(4)` in others for the same field; these helpers fix the precision
 * per kind of number instead.
 */

/** Unit economics, 4dp: "$0.0386". Use for per-asset generation cost. */
export function formatCost(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `$${value.toFixed(4)}`;
}

/** Rolled-up spend, 3dp: "$0.158". */
export function formatSpend(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `$${value.toFixed(3)}`;
}

/** "42.8k" for token counts. */
export function formatTokens(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1)}k`;
}

/** "1.42s" from milliseconds. */
export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  return `${(ms / 1000).toFixed(2)}s`;
}

/** The placeholder shown wherever a real measurement is not available. */
export const NOT_AVAILABLE = "—";
