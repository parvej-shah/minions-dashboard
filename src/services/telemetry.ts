import { prisma } from "@/lib/prisma";
import { TELEMETRY_RANGE_MS, TELEMETRY_RANGES, type TelemetryPayload, type TelemetryRange, type TelemetryRow } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const COST_PRECISION = 4;

export function parseTelemetryRange(value: string | null): TelemetryRange {
  return TELEMETRY_RANGES.includes(value as TelemetryRange) ? (value as TelemetryRange) : "7d";
}

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export async function buildTelemetry(clientId: string, range: TelemetryRange): Promise<TelemetryPayload> {
  const windowMs = TELEMETRY_RANGE_MS[range];
  const since = windowMs === null ? null : new Date(Date.now() - windowMs);

  const assets = await prisma.asset.findMany({
    where: { clientId, ...(since ? { createdAt: { gte: since } } : {}) },
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

  const ledger: TelemetryRow[] = assets.map((asset) => ({
    asset_id: asset.id,
    title: asset.title,
    audience: (asset.audience || "ICP") as TelemetryRow["audience"],
    total_cost: Number(asset.generationCost),
    created_at: asset.createdAt.toISOString(),
  }));

  const totalCost = ledger.reduce((sum, row) => sum + row.total_cost, 0);
  const allClaims = assets.flatMap((asset) => asset.claims);
  const publishedCount = assets.filter((asset) => asset.publishedAt !== null).length;

  const oldest = assets.length > 0 ? assets[assets.length - 1].createdAt : null;
  const windowDays =
    windowMs !== null ? windowMs / DAY_MS : oldest ? (Date.now() - oldest.getTime()) / DAY_MS : null;

  return {
    range,
    since: since ? since.toISOString() : null,
    ledger,
    summary: {
      avgCostPerAsset: ledger.length > 0 ? +(totalCost / ledger.length).toFixed(COST_PRECISION) : null,
      totalPeriodSpend: ledger.length > 0 ? +totalCost.toFixed(COST_PRECISION) : null,
      totalAssetsGenerated: ledger.length,
      wordsGenerated: assets.reduce((sum, asset) => sum + countWords(asset.content), 0),
      claimsVerified: allClaims.filter((claim) => claim.verified === "Y").length,
      claimsTotal: allClaims.length,
      publishedCount,
      publishingVelocityPerWeek: windowDays && windowDays > 0 ? +((publishedCount / windowDays) * 7).toFixed(1) : null,
    },
  };
}
