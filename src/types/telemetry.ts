/**
 * One row of the generation cost ledger, as returned by /api/telemetry.
 * This replaces the previously divergent `TelemetryRow` / `TelemetryItem` pair.
 *
 * Only fields that exist as real columns on `assets` appear here. The route
 * used to synthesise `strategist_tokens` / `writer_tokens` / `editor_tokens`
 * from the word count (`words * 1.35 * 6.2`, split 11/62/27) and `latency_ms`
 * from the row index (`1350 + idx * 45`), then present both as measurements.
 * The schema has no token or latency columns, so those are gone rather than
 * guessed. Reinstate them as real fields when the pipeline records them.
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
  /** Not recorded anywhere in the schema today; always null. */
  totalFleetTokens: number | null;
  /** Not recorded anywhere in the schema today; always null. */
  pipelineLatencyMs: number | null;
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
