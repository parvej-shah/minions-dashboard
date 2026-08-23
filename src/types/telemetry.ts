/**
 * One row of the content ledger, as returned by /api/telemetry.
 * This replaces the previously divergent `TelemetryRow` / `TelemetryItem` pair.
 *
 * Only fields that exist as real columns on `assets` appear here. The route
 * used to synthesise `strategist_tokens` / `writer_tokens` / `editor_tokens`
 * from the word count (`words * 1.35 * 6.2`, split 11/62/27) and `latency_ms`
 * from the row index (`1350 + idx * 45`), then present both as measurements.
 * The schema has no token or latency columns, so those are gone rather than
 * guessed — the summary metrics instead report the content-value figures a
 * tenant actually cares about (words generated, claims verified, publishing
 * velocity), not internal infra measurements.
 */
export interface TelemetryRow {
  asset_id: string;
  title: string;
  audience: "ICP" | "PEER" | "BRIDGE";
  /** Recorded `generation_cost` for the run, in USD. */
  total_cost: number;
  created_at: string;
}

export interface TelemetrySummary {
  /** Null when the range contains no assets — never a placeholder figure. */
  avgCostPerAsset: number | null;
  totalPeriodSpend: number | null;
  totalAssetsGenerated: number;
  /** Sum of word counts across every asset's content in the window. */
  wordsGenerated: number;
  /** Claims with verified = 'Y' out of every claim recorded on assets in the window. */
  claimsVerified: number;
  claimsTotal: number;
  /** Assets with a non-null published_at in the window. */
  publishedCount: number;
  /** publishedCount normalized to a per-week rate. Null when the window has
   *  no elapsed time to normalize against (a brand new tenant with no assets
   *  yet, on the "all" range). */
  publishingVelocityPerWeek: number | null;
}

export interface TelemetryPayload {
  range: TelemetryRange;
  /** ISO timestamp the window starts at, or null for `all`. */
  since: string | null;
  ledger: TelemetryRow[];
  summary: TelemetrySummary;
}

/** Ledger ranges the UI offers. Each is aggregated server-side over `created_at`. */
export type TelemetryRange = "24h" | "7d" | "30d" | "all";

export const TELEMETRY_RANGES: TelemetryRange[] = ["24h", "7d", "30d", "all"];

export const TELEMETRY_RANGE_LABELS: Record<TelemetryRange, string> = {
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
  all: "All Time",
};

/** Window length in milliseconds. `all` has no lower bound. */
export const TELEMETRY_RANGE_MS: Record<TelemetryRange, number | null> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  all: null,
};
