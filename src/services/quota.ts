import { prisma } from "@/lib/prisma";
import { findPlan, type PlanDefinition } from "@/constants/plans";

const DEFAULT_PLAN_KEY = "starter";

export function startOfMonth(): Date {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function resolvePlan(planKey: string | null | undefined): PlanDefinition {
  return findPlan(planKey ?? DEFAULT_PLAN_KEY) ?? findPlan(DEFAULT_PLAN_KEY)!;
}

export function monthlyAssetLimit(plan: PlanDefinition, override: number | null | undefined): number {
  return override ?? plan.limits.assetsPerMonth;
}

export function countAssetsThisMonth(clientId: string, since: Date = startOfMonth()): Promise<number> {
  return prisma.asset.count({ where: { clientId, createdAt: { gte: since } } });
}
