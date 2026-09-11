import { prisma } from "@/lib/prisma";

/**
 * System-wide daily ceilings on pipeline runs, across every tenant.
 *
 * These are pre-production cost guards, not product rules.
 *
 * HARVEST scales with tenant count rather than usage: 00_tenant_dispatcher
 * fires one run per ACTIVE client every night, each spending two Qwen calls
 * plus a per-source fetch. Nine active tenants already sit at 9/10, so a tenth
 * would cross the line without anyone changing a setting.
 *
 * DRAFT is capped lower because it is the expensive half of the pipeline: two
 * writer calls, a claims-gate pass, social variants, and a hero image generated
 * in its own workflow. Harvesting only produces ideas; drafting is what turns
 * them into billable model time.
 *
 * Both are deliberately global rather than per-tenant: `Backlog Guard` inside
 * 01_idea_harvester already caps how much work ONE tenant can queue, and it
 * cannot see the others. A cap that counts per tenant would let N tenants each
 * stay under their own limit while the system as a whole ran N times over.
 */
export const DAILY_HARVEST_LIMIT = 10;
export const DAILY_DRAFT_LIMIT = 5;

export type RunType = "HARVEST" | "DRAFT";

export const DAILY_LIMITS: Record<RunType, number> = {
  HARVEST: DAILY_HARVEST_LIMIT,
  DRAFT: DAILY_DRAFT_LIMIT,
};

/** Counts against the UTC day, matching the dispatcher's `0 0 * * *` cron. */
export function startOfUtcDay(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface RunBudget {
  type: RunType;
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
}

/** Back-compat alias: the harvest-slot endpoint shipped with this name. */
export type HarvestBudget = RunBudget;

function toBudget(type: RunType, used: number): RunBudget {
  const limit = DAILY_LIMITS[type];
  return {
    type,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    exhausted: used >= limit,
  };
}

/**
 * How much of today's budget is left for a run type.
 *
 * Counts every run row regardless of status. A run that failed still spent the
 * API calls that make this cap worth having, so refunding it would turn a
 * failing pipeline into an unbounded one.
 *
 * Read-only: safe for display, but do NOT gate a trigger on this alone -- see
 * `claimRunSlot` for why.
 */
export async function getRunBudget(
  type: RunType,
  now: Date = new Date()
): Promise<RunBudget> {
  const used = await prisma.pipelineRun.count({
    where: { type, createdAt: { gte: startOfUtcDay(now) } },
  });
  return toBudget(type, used);
}

/** @deprecated Use `getRunBudget("HARVEST")`. */
export const getHarvestBudget = (now?: Date) => getRunBudget("HARVEST", now);

export type RunSlot =
  | { granted: true; runId: string; budget: RunBudget }
  | { granted: false; runId: null; budget: RunBudget };

/**
 * Reserves one unit of today's budget and returns the run row that holds it.
 *
 * Check-then-create would leak over the cap: the harvest dispatcher fans out
 * one request per ACTIVE tenant within a few milliseconds, so every one of them
 * can read the same `used` value before any has written its row, and all of
 * them pass a check that only one should have. Instead we create the row first
 * -- taking the slot -- then count. Losers delete their own row and bail, so
 * the count settles at the limit rather than at the number of concurrent
 * callers. Verified against production: 12 simultaneous claims produced exactly
 * 10 rows and 2 rejections.
 *
 * The row doubles as the audit trail: scheduled harvests previously wrote no
 * `pipeline_runs` row at all, which is why that table showed a last-harvest
 * date days old while nine ran that morning.
 */
export async function claimRunSlot(
  type: RunType,
  clientId: string,
  metadata?: Record<string, unknown>
): Promise<RunSlot> {
  const since = startOfUtcDay();
  const limit = DAILY_LIMITS[type];

  const run = await prisma.pipelineRun.create({
    data: {
      clientId,
      type,
      status: "RUNNING",
      ...(metadata ? { metadata: metadata as never } : {}),
    },
  });

  // Ordering by creation makes the winners deterministic: the first `limit`
  // rows of the day keep their slot, later ones yield.
  const olderOrSame = await prisma.pipelineRun.count({
    where: {
      type,
      createdAt: { gte: since, lte: run.createdAt },
      id: { not: run.id },
    },
  });

  if (olderOrSame >= limit) {
    await prisma.pipelineRun.delete({ where: { id: run.id } }).catch(() => {});
    return { granted: false, runId: null, budget: toBudget(type, olderOrSame) };
  }

  return { granted: true, runId: run.id, budget: toBudget(type, olderOrSame + 1) };
}

/** @deprecated Use `claimRunSlot("HARVEST", ...)`. */
export const claimHarvestSlot = (clientId: string, metadata?: Record<string, unknown>) =>
  claimRunSlot("HARVEST", clientId, metadata);
