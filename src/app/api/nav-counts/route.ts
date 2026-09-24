import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPipelineFleet } from "@/services/agents";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { findPlan } from "@/constants/plans";
import type { NavCounts } from "@/types";
import { getPulse } from "@/services/pulse";

/**
 * Sidebar badge counts in one round trip.
 *
 * The dashboard shell previously fetched /api/ideas, /api/assets,
 * /api/published, /api/brand/directives and /api/agents in parallel on every
 * navigation and counted the rows in the browser.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [ideasReady, pendingReview, publishedLive, directivesCount, fleet, assetsThisMonth, subscription, client, pulse] =
      await Promise.all([
        prisma.idea.count({
          where: { clientId: ctx.clientId, status: { in: ["HARVESTED", "REFINED"] } },
        }),
        prisma.asset.count({ where: { clientId: ctx.clientId, status: "PENDING_REVIEW" } }),
        prisma.blog.count({ where: { clientId: ctx.clientId } }),
        prisma.brandDirective.count({ where: { clientId: ctx.clientId } }),
        getPipelineFleet(ctx.clientId).catch(() => []),
        prisma.asset.count({ where: { clientId: ctx.clientId, createdAt: { gte: startOfMonth } } }),
        prisma.subscription.findUnique({ where: { clientId: ctx.clientId }, select: { planKey: true } }),
        prisma.client.findUnique({ where: { id: ctx.clientId }, select: { assetsPerMonthOverride: true } }),
        getPulse(ctx.clientId).catch(() => null),
      ]);

    // No Subscription row yet (tenant-zero, or a trial that hasn't hit
    // checkout) defaults to the lowest tier's limit rather than showing an
    // unbounded meter.
    const planKey = subscription?.planKey ?? "starter";
    const plan = findPlan(planKey) ?? findPlan("starter")!;
    // A maintainer-set override (platform-admin dashboard) beats the plan default --
    // independent of billing entirely, see Client.assetsPerMonthOverride.
    const assetsPerMonthLimit = client?.assetsPerMonthOverride ?? plan.limits.assetsPerMonth;

    const counts: NavCounts = {
      ideasReady,
      pendingReview,
      publishedLive,
      directivesCount,
      activeAgents: fleet.filter((a) => a.status === "ACTIVE").length,
      pulseDue: pulse?.state === "DUE" || pulse?.state === "CONFIRM",
      quota: {
        used: assetsThisMonth,
        limit: assetsPerMonthLimit,
        planKey: plan.key,
      },
    };

    return NextResponse.json(counts);
  } catch (error) {
    return apiError(error, "Failed to fetch nav counts");
  }
}
