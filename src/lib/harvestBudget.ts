import { prisma } from "@/lib/prisma";

/**
 * System-wide daily ceilings on pipeline runs, across every tenant.
 *
 * These are pre-production cost guards, not product rules.
 *
 * HARVEST scales with tenant count rather than usage: 00_tenant_dispatcher
 * fires one run per ACTIVE client every night, each spending two Qwen calls
 * plus a per-source fetch, so the ceiling has to leave room for the nightly
 * fan-out plus manual runs and onboarding, or a new tenant's first harvest is
 * refused after the nightly runs use the day.
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
export const DAILY_HARVEST_LIMIT = 50;
export const DAILY_DRAFT_LIMIT = 20;

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
async function getRunBudget(
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

/**
 * A run is considered dead after this long with no terminal callback. n8n's own
 * draft path takes ~85s and harvest ~25s, so a run still RUNNING well past that
 * has lost its workflow -- the process died, or the callback never fired.
 */
const RUN_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Marks every run stuck in RUNNING past `RUN_TIMEOUT_MS` as FAILED.
 *
 * Previously this only happened when a caller GET'd that exact run's status
 * endpoint -- if nobody kept polling (tab closed, HUD navigated away from), the
 * row stayed RUNNING forever. Called from `claimRunSlot` so every new trigger
 * self-heals stale runs from earlier in the day, independent of who's watching.
 */
export async function sweepStaleRuns(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - RUN_TIMEOUT_MS);
  const stale = await prisma.pipelineRun.findMany({
    where: { status: "RUNNING", createdAt: { lt: cutoff } },
    select: { id: true, metadata: true },
  });

  if (stale.length === 0) return 0;

  await Promise.all(
    stale.map((run) =>
      prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          metadata: {
            ...((run.metadata as Record<string, unknown>) ?? {}),
            error: "The run stopped reporting progress and was marked failed.",
            timedOut: true,
          },
        },
      })
    )
  );

  return stale.length;
}

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
 * The row doubles as the audit trail: every scheduled harvest leaves a `pipeline_runs` row.
 */
export async function claimRunSlot(
  type: RunType,
  clientId: string,
  metadata?: Record<string, unknown>
): Promise<RunSlot> {
  const since = startOfUtcDay();
  const limit = DAILY_LIMITS[type];

  await sweepStaleRuns();

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
