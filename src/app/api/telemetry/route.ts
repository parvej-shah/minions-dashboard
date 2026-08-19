import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import {
  TELEMETRY_RANGE_MS,
  TELEMETRY_RANGES,
  type TelemetryPayload,
  type TelemetryRange,
  type TelemetryRow,
} from "@/types";

function parseRange(value: string | null): TelemetryRange {
  return TELEMETRY_RANGES.includes(value as TelemetryRange) ? (value as TelemetryRange) : "7d";
}

/**
 * Cost ledger for a time window, aggregated server-side over `assets.created_at`.
 *
 * Every figure here comes from a real column. Token meters and latency traces
 * are deliberately absent: the schema records neither, and the previous version
 * of this route derived them from the word count and the row index, which made
 * invented numbers look like measurements.
 */
export async function GET(request: NextRequest) {
  try {
    const range = parseRange(request.nextUrl.searchParams.get("range"));
    const windowMs = TELEMETRY_RANGE_MS[range];
    const since = windowMs === null ? null : new Date(Date.now() - windowMs);

    const assets = await prisma.asset.findMany({
      where: since ? { createdAt: { gte: since } } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        audience: true,
        generationCost: true,
        createdAt: true,
      },
    });

    const ledger: TelemetryRow[] = assets.map((a) => ({
      asset_id: a.id,
      title: a.title,
      audience: (a.audience || "ICP") as TelemetryRow["audience"],
      total_cost: Number(a.generationCost),
      created_at: a.createdAt.toISOString(),
    }));

    const totalCost = ledger.reduce((acc, row) => acc + row.total_cost, 0);

    const payload: TelemetryPayload = {
      range,
      since: since ? since.toISOString() : null,
      ledger,
      summary: {
        avgCostPerAsset: ledger.length > 0 ? +(totalCost / ledger.length).toFixed(4) : null,
        totalPeriodSpend: ledger.length > 0 ? +totalCost.toFixed(4) : null,
        totalAssetsGenerated: ledger.length,
        // No token or latency columns exist. Null, not an estimate.
        totalFleetTokens: null,
        pipelineLatencyMs: null,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    return apiError(error, "Failed to generate telemetry");
  }
}
