import { prisma } from "@/lib/prisma";
import { computeDueSlot } from "@/lib/scheduling";
import { slotsToDraftNow } from "@/lib/plan/ahead";
import { fillDueSlot, planAhead, upcomingPlanSlots } from "@/services/contentPlan";
import { toScheduleConfig } from "@/services/postingSchedule";
import { countAssetsThisMonth, monthlyAssetLimit, resolvePlan } from "@/services/quota";

export interface DueTenant {
  client_id: string;
  slug: string;
  idea_id: string;
  slot_id: string;
  fill_method: string;
}

export async function findDueTenants(now: Date = new Date()) {
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

  const due: DueTenant[] = [];
  const planned: Record<string, unknown> = {};

  for (const schedule of schedules) {
    const { client } = schedule;
    planned[client.id] = await planAhead(client.id, now).catch((error) => {
      console.warn(`[plan] look-ahead failed for ${client.id}:`, error);
      return undefined;
    });
    if (planned[client.id] === undefined) delete planned[client.id];

    // The slot due right now (the fallback), then the slots in the next 24 hours:
    // each is drafted a day ahead, so Autopilot has it scheduled before its time.
    const dueNow = computeDueSlot(toScheduleConfig(schedule), client.timezone, now);
    const upcoming = upcomingPlanSlots(schedule, client.timezone, now);
    const handled = await prisma.scheduleSlot.findMany({
      where: { clientId: client.id, slotAt: { in: upcoming }, status: { notIn: ["PLANNED", "HARVESTING"] } },
      select: { slotAt: true },
    });
    const ahead = slotsToDraftNow(upcoming, now, new Set(handled.map((h) => h.slotAt.getTime())));
    const slots = dueNow ? [{ at: dueNow, ahead: false }, ...ahead.map((at) => ({ at, ahead: true }))] : ahead.map((at) => ({ at, ahead: true }));

    const limit = monthlyAssetLimit(resolvePlan(client.subscription?.planKey), client.assetsPerMonthOverride);
    let used = await countAssetsThisMonth(client.id);

    for (const { at, ahead: isAhead } of slots) {
      if (used >= limit) break;

      // Autonomous outcome guard (task 72): cap unposted drafts awaiting review at 5 max
      // to protect executive attention and prevent backlog guilt. Autopilot has no
      // review queue, so the cap applies to Review first only (task 108).
      if (schedule.requireReview) {
        const unreviewedDrafts = await prisma.asset.count({ where: { clientId: client.id, status: "PENDING_REVIEW" } });
        if (unreviewedDrafts >= 5) break;
      }

      const fill = await fillDueSlot(client.id, at, now, { ahead: isAhead });
      if (!fill) continue;
      used += 1;
      due.push({ client_id: client.id, slug: client.slug, idea_id: fill.idea_id, slot_id: fill.slot_id, fill_method: fill.method });
    }
  }

  return { due_tenants: due, planned };
}
