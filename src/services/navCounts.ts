import { prisma } from "@/lib/prisma";
import { getPipelineFleet } from "@/services/agents";
import { getPulse } from "@/services/pulse";
import { countAssetsThisMonth, monthlyAssetLimit, resolvePlan } from "@/services/quota";
import type { NavCounts } from "@/types";

export async function getNavCounts(clientId: string): Promise<NavCounts> {
  const [ideasReady, pendingReview, publishedLive, directivesCount, fleet, assetsThisMonth, subscription, client, pulse] =
    await Promise.all([
      prisma.idea.count({ where: { clientId, status: { in: ["HARVESTED", "REFINED"] } } }),
      prisma.asset.count({ where: { clientId, status: "PENDING_REVIEW" } }),
      prisma.blog.count({ where: { clientId } }),
      prisma.brandDirective.count({ where: { clientId } }),
      getPipelineFleet(clientId).catch(() => []),
      countAssetsThisMonth(clientId),
      prisma.subscription.findUnique({ where: { clientId }, select: { planKey: true } }),
      prisma.client.findUnique({ where: { id: clientId }, select: { assetsPerMonthOverride: true } }),
      getPulse(clientId).catch(() => null),
    ]);

  const plan = resolvePlan(subscription?.planKey);

  return {
    ideasReady,
    pendingReview,
    publishedLive,
    directivesCount,
    activeAgents: fleet.filter((agent) => agent.status === "ACTIVE").length,
    pulseDue: pulse?.state === "DUE" || pulse?.state === "CONFIRM",
    quota: {
      used: assetsThisMonth,
      limit: monthlyAssetLimit(plan, client?.assetsPerMonthOverride),
      planKey: plan.key,
    },
  };
}
