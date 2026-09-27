import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { findPlan } from "@/constants/plans";
import { computeDueSlot } from "@/lib/scheduling";
import { fillDueSlot, planAhead } from "@/services/contentPlan";

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
 *
 * Phase 7: only workspaces with the content plan's slot filler switched on
 * (`filler_enabled`) are drafted for. For each, every call runs the look-ahead
 * (plan the next 7 days, reserve ideas, harvest early for an empty lane), and a
 * due slot names the idea 02 should draft (`idea_id`), chosen in code by
 * src/lib/plan/fill.ts. A due slot with nothing to draft is recorded EMPTY and
 * not returned. Cadence-only drafting, with 02 picking any idea, is retired:
 * 00b has been off since 2026-09-21 and the plan replaces it.
 */
export async function GET(request: Request) {
  const check = await verifyWebhookSecret(request);
  if (!check.isValid) return check.response!;
  await recordHeartbeat("00b_posting_scheduler_dispatcher");

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const schedules = await prisma.postingSchedule.findMany({
      where: { isActive: true, fillerEnabled: true, client: { status: "ACTIVE" } },
      include: {
        client: {
          select: {
            id: true,
            slug: true,
            timezone: true,
            assetsPerMonthOverride: true,
            subscription: { select: { planKey: true } },
          },
        },
      },
    });

    const now = new Date();
    const due: { client_id: string; slug: string; idea_id: string; slot_id: string; fill_method: string }[] = [];
    const planned: Record<string, unknown> = {};

    for (const schedule of schedules) {
      try {
        planned[schedule.client.id] = await planAhead(schedule.client.id, now);
      } catch (e) {
        // One workspace's look-ahead failing must not stop the others' drafts.
        console.warn(`[plan] look-ahead failed for ${schedule.client.id}:`, e);
      }

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
      // A maintainer-set override (platform-admin dashboard) beats the plan default --
      // independent of billing entirely, see Client.assetsPerMonthOverride.
      const assetsPerMonthLimit = schedule.client.assetsPerMonthOverride ?? plan.limits.assetsPerMonth;
      const assetsThisMonth = await prisma.asset.count({
        where: { clientId: schedule.client.id, createdAt: { gte: startOfMonth } },
      });
      if (assetsThisMonth >= assetsPerMonthLimit) continue; // over cap, skip silently

      const fill = await fillDueSlot(schedule.client.id, slot, now);
      if (!fill) continue;
      due.push({ client_id: schedule.client.id, slug: schedule.client.slug, idea_id: fill.idea_id, slot_id: fill.slot_id, fill_method: fill.method });
    }

    return NextResponse.json({ due_tenants: due, planned });
  } catch (error) {
    return apiError(error, "Failed to compute due tenants");
  }
}
