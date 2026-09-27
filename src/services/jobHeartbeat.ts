import { prisma } from "@/lib/prisma";
import { AUTOMATION_JOBS, MISSED_RUNS_ALLOWED, type AutomationJob } from "@/constants/automations";

/**
 * Records that a background job ran. Called from the dashboard route the job
 * calls on every run, so a check-in is what actually happened in n8n rather
 * than a setting. Best-effort: a failed write never fails the job's request.
 */
export async function recordHeartbeat(job: string, at: Date = new Date()): Promise<void> {
  try {
    await prisma.jobHeartbeat.upsert({
      where: { job },
      create: { job, lastRunAt: at },
      update: { lastRunAt: at, runs: { increment: 1 } },
    });
  } catch (e) {
    console.warn(`[heartbeat] could not record ${job}:`, e);
  }
}

/** RUNNING / STOPPED for a timed job; ON_DEMAND for one that runs only when called. */
export type JobState = "RUNNING" | "STOPPED" | "ON_DEMAND";

export function jobState(job: Pick<AutomationJob, "everyMinutes">, lastRunAt: Date | null, now: Date): JobState {
  if (job.everyMinutes === null) return "ON_DEMAND";
  if (!lastRunAt) return "STOPPED";
  return now.getTime() - lastRunAt.getTime() <= job.everyMinutes * MISSED_RUNS_ALLOWED * 60_000 ? "RUNNING" : "STOPPED";
}

export interface AutomationStatus extends AutomationJob {
  state: JobState;
  last_run_at: string | null;
}

export async function readAutomations(now: Date = new Date()): Promise<AutomationStatus[]> {
  const rows = await prisma.jobHeartbeat.findMany();
  const last = new Map(rows.map((r) => [r.job, r.lastRunAt]));
  return AUTOMATION_JOBS.map((job) => {
    const at = last.get(job.key) ?? null;
    return { ...job, state: jobState(job, at, now), last_run_at: at?.toISOString() ?? null };
  });
}

/** Is the automatic-drafting job (00b) running right now? */
export async function draftingServiceRunning(now: Date = new Date()): Promise<{ running: boolean; last_run_at: string | null }> {
  const job = AUTOMATION_JOBS.find((j) => j.key === "00b_posting_scheduler_dispatcher")!;
  const row = await prisma.jobHeartbeat.findUnique({ where: { job: job.key } });
  return { running: jobState(job, row?.lastRunAt ?? null, now) === "RUNNING", last_run_at: row?.lastRunAt.toISOString() ?? null };
}
