import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
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
 * Content ledger for a time window, aggregated server-side over `assets.created_at`.
 *
 * Every figure here comes from a real column. Token meters and latency traces
 * are deliberately absent: the schema records neither, and the previous version
 * of this route derived them from the word count and the row index, which made
 * invented numbers look like measurements. The summary reports content-value
 * metrics (words generated, claims verified, publishing velocity) instead of
 * internal infra measurements, since those are what a tenant reviewing their
 * own account actually cares about — not token counts or model latency.
 */
export async function GET(request: NextRequest) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const range = parseRange(request.nextUrl.searchParams.get("range"));
    const windowMs = TELEMETRY_RANGE_MS[range];
    const since = windowMs === null ? null : new Date(Date.now() - windowMs);

    const assets = await prisma.asset.findMany({
      where: { clientId: ctx.clientId, ...(since ? { createdAt: { gte: since } } : {}) },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        audience: true,
        generationCost: true,
        createdAt: true,
        content: true,
        publishedAt: true,
        claims: { select: { verified: true } },
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
    const wordsGenerated = assets.reduce(
      (acc, a) => acc + a.content.trim().split(/\s+/).filter(Boolean).length,
      0
    );
    const allClaims = assets.flatMap((a) => a.claims);
    const claimsVerified = allClaims.filter((c) => c.verified === "Y").length;
    const publishedCount = assets.filter((a) => a.publishedAt !== null).length;

    // Normalize published count to a per-week rate. "all" has no fixed
    // window, so use the actual span from the oldest asset in this tenant's
    // history to now instead of guessing a period length.
    let windowDays: number | null = windowMs !== null ? windowMs / (24 * 60 * 60 * 1000) : null;
    if (windowDays === null) {
      const oldest = assets.length > 0 ? assets[assets.length - 1].createdAt : null;
      windowDays = oldest ? (Date.now() - oldest.getTime()) / (24 * 60 * 60 * 1000) : null;
    }
    const publishingVelocityPerWeek =
      windowDays && windowDays > 0 ? +((publishedCount / windowDays) * 7).toFixed(1) : null;

    const payload: TelemetryPayload = {
      range,
      since: since ? since.toISOString() : null,
      ledger,
      summary: {
        avgCostPerAsset: ledger.length > 0 ? +(totalCost / ledger.length).toFixed(4) : null,
        totalPeriodSpend: ledger.length > 0 ? +totalCost.toFixed(4) : null,
        totalAssetsGenerated: ledger.length,
        wordsGenerated,
        claimsVerified,
        claimsTotal: allClaims.length,
        publishedCount,
        publishingVelocityPerWeek,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    return apiError(error, "Failed to generate telemetry");
  }
}
