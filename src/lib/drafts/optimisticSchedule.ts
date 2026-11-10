import { zonedToUtc } from "@/lib/postTime";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import type { AssetItem } from "@/types";

/**
 * Optimistically prepares an asset for SCHEDULED state without waiting for
 * server roundtrip. Gives the user instant feedback on click.
 */
export function applyOptimisticSchedule(
  asset: AssetItem,
  date: string,
  time: string,
  tz: string = DEFAULT_TIMEZONE
): AssetItem {
  const instant = zonedToUtc(date, time, tz) ?? new Date();
  return {
    ...asset,
    status: "SCHEDULED",
    claims_ok: "Y",
    scheduled_for: instant.toISOString(),
  };
}

/**
 * Rolls back an optimistically scheduled asset if the server request fails.
 */
export function rollbackSchedule(current: AssetItem, snapshot: AssetItem): AssetItem {
  return {
    ...current,
    status: snapshot.status,
    claims_ok: snapshot.claims_ok,
    scheduled_for: snapshot.scheduled_for,
  };
}
