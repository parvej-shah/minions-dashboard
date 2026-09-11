import { prisma } from "@/lib/prisma";

/**
 * System-wide daily ceiling on harvest runs, across every tenant.
 *
 * This is a pre-production cost guard, not a product rule. Each harvest spends
 * two Qwen calls plus a per-source fetch, and the dispatcher fans out one run
 * per ACTIVE client -- so the bill scales with tenant count, not with usage.
 * Nine active tenants on a daily schedule already sit just under this ceiling;
 * a tenth tenant would cross it without anyone changing a setting.
 *
 * Deliberately global rather than per-tenant: `Backlog Guard` inside
 * 01_idea_harvester already caps how much work ONE tenant can queue, and it
 * cannot see the others. A cap that counts per tenant would let N tenants each
 * stay under their own limit while the system as a whole ran N times over.
 */
export const DAILY_HARVEST_LIMIT = 10;

/** Counts against the UTC day, matching the dispatcher's `0 0 * * *` cron. */
export function startOfUtcDay(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface HarvestBudget {
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
}

/**
 * How much of today's harvest budget is left.
 *
 * Counts every HARVEST run row regardless of status. A run that failed still
 * spent the API calls that make this cap worth having, so refunding it would
 * turn a failing pipeline into an unbounded one.
 *
 * Read-only: safe for display, but do NOT gate a trigger on this alone -- see
 * `claimHarvestSlot` for why.
 */
export async function getHarvestBudget(now: Date = new Date()): Promise<HarvestBudget> {
  const used = await prisma.pipelineRun.count({
    where: { type: "HARVEST", createdAt: { gte: startOfUtcDay(now) } },
  });

  return {
    used,
    limit: DAILY_HARVEST_LIMIT,
    remaining: Math.max(0, DAILY_HARVEST_LIMIT - used),
    exhausted: used >= DAILY_HARVEST_LIMIT,
  };
}

export type HarvestSlot =
  | { granted: true; runId: string; budget: HarvestBudget }
  | { granted: false; runId: null; budget: HarvestBudget };

/**
 * Reserves one unit of today's budget and returns the run row that holds it.
 *
 * Check-then-create would leak over the cap: the dispatcher fans out one
 * request per ACTIVE tenant within a few milliseconds, so every one of them can
 * read the same `used` value before any has written its row, and all of them
 * pass a check that only one should have. Instead we create the row first --
 * taking the slot -- then count. Losers delete their own row and bail, so the
 * count settles at the limit rather than at the number of concurrent callers.
 *
 * The row doubles as the audit trail: scheduled harvests previously wrote no
 * `pipeline_runs` row at all, which is why that table showed a last-harvest date
 * of days ago while nine ran this morning.
 */
export async function claimHarvestSlot(
  clientId: string,
  metadata?: Record<string, unknown>
): Promise<HarvestSlot> {
  const since = startOfUtcDay();

  const run = await prisma.pipelineRun.create({
    data: {
      clientId,
      type: "HARVEST",
      status: "RUNNING",
      ...(metadata ? { metadata: metadata as never } : {}),
    },
  });

  // Ordering by creation makes the winners deterministic: the first
  // DAILY_HARVEST_LIMIT rows of the day keep their slot, later ones yield.
  const olderOrSame = await prisma.pipelineRun.count({
    where: {
      type: "HARVEST",
      createdAt: { gte: since, lte: run.createdAt },
      id: { not: run.id },
    },
  });

  if (olderOrSame >= DAILY_HARVEST_LIMIT) {
    await prisma.pipelineRun.delete({ where: { id: run.id } }).catch(() => {});
    return {
      granted: false,
      runId: null,
      budget: {
        used: olderOrSame,
        limit: DAILY_HARVEST_LIMIT,
        remaining: 0,
        exhausted: true,
      },
    };
  }

  const used = olderOrSame + 1;
  return {
    granted: true,
    runId: run.id,
    budget: {
      used,
      limit: DAILY_HARVEST_LIMIT,
      remaining: Math.max(0, DAILY_HARVEST_LIMIT - used),
      exhausted: used >= DAILY_HARVEST_LIMIT,
    },
  };
}
