import { prisma } from "@/lib/prisma";
import { findPlan } from "@/constants/plans";
import { getPipelineFleet } from "@/services/agents";
import { getPulse } from "@/services/pulse";
import type { NavCounts } from "@/types";

const DEFAULT_PLAN_KEY = "starter";

function startOfMonth(): Date {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function getNavCounts(clientId: string): Promise<NavCounts> {
  const [ideasReady, pendingReview, publishedLive, directivesCount, fleet, assetsThisMonth, subscription, client, pulse] =
    await Promise.all([
      prisma.idea.count({ where: { clientId, status: { in: ["HARVESTED", "REFINED"] } } }),
      prisma.asset.count({ where: { clientId, status: "PENDING_REVIEW" } }),
      prisma.blog.count({ where: { clientId } }),
      prisma.brandDirective.count({ where: { clientId } }),
      getPipelineFleet(clientId).catch(() => []),
      prisma.asset.count({ where: { clientId, createdAt: { gte: startOfMonth() } } }),
      prisma.subscription.findUnique({ where: { clientId }, select: { planKey: true } }),
      prisma.client.findUnique({ where: { id: clientId }, select: { assetsPerMonthOverride: true } }),
      getPulse(clientId).catch(() => null),
    ]);

  const plan = findPlan(subscription?.planKey ?? DEFAULT_PLAN_KEY) ?? findPlan(DEFAULT_PLAN_KEY)!;

  return {
    ideasReady,
    pendingReview,
    publishedLive,
    directivesCount,
    activeAgents: fleet.filter((agent) => agent.status === "ACTIVE").length,
    pulseDue: pulse?.state === "DUE" || pulse?.state === "CONFIRM",
    quota: {
      used: assetsThisMonth,
      limit: client?.assetsPerMonthOverride ?? plan.limits.assetsPerMonth,
      planKey: plan.key,
    },
  };
}
