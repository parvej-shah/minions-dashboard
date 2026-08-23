import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { findPlan } from "@/constants/plans";
import { computeDueSlot } from "@/lib/scheduling";

/**
 * Server-to-server only (n8n's 00b_posting_scheduler_dispatcher polls this
 * every 5 minutes) -- not a tenant-scoped route, so it's secret-gated like
 * the /api/webhooks/* routes instead of requireClientId(). Returns every
 * ACTIVE tenant that is due for a post right now, per its PostingSchedule,
 * excluding anyone at or over their plan's assetsPerMonth cap this month --
 * the first real enforcement point for that cap anywhere in this codebase
 * (see src/app/api/billing/route.ts's docstring: no Subscription.planKey is
 * persisted anywhere yet, so every tenant resolves to "starter" today,
 * mirrored here exactly the same way).
 */
export async function GET(request: Request) {
  const check = verifyWebhookSecret(request);
  if (!check.isValid) return check.response!;

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const schedules = await prisma.postingSchedule.findMany({
      where: { isActive: true, client: { status: "ACTIVE" } },
      include: { client: { select: { id: true, slug: true, timezone: true, subscription: { select: { planKey: true } } } } },
    });

    const now = new Date();
    const due: { client_id: string; slug: string }[] = [];

    for (const schedule of schedules) {
      const slot = computeDueSlot(
        {
          cadenceType: schedule.cadenceType,
          intervalDays: schedule.intervalDays,
          daysOfWeek: schedule.daysOfWeek,
          postsPerDay: schedule.postsPerDay,
          timesOfDay: schedule.timesOfDay,
          isActive: schedule.isActive,
          lastRunAt: schedule.lastRunAt,
          createdAt: schedule.createdAt,
        },
        schedule.client.timezone,
        now
      );
      if (!slot) continue;

      const planKey = schedule.client.subscription?.planKey ?? "starter";
      const plan = findPlan(planKey) ?? findPlan("starter")!;
      const assetsThisMonth = await prisma.asset.count({
        where: { clientId: schedule.client.id, createdAt: { gte: startOfMonth } },
      });
      if (assetsThisMonth >= plan.limits.assetsPerMonth) continue; // over cap, skip silently

      due.push({ client_id: schedule.client.id, slug: schedule.client.slug });
    }

    return NextResponse.json({ due_tenants: due });
  } catch (error) {
    return apiError(error, "Failed to compute due tenants");
  }
}
