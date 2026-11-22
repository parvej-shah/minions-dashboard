import { prisma } from "@/lib/prisma";
import { computeDueSlot } from "@/lib/scheduling";
import { AUTOPILOT_LEAD_HOURS, DRAFT_LEAD_HOURS, REVIEW_MIN_SLOTS, slotsToDraftNow } from "@/lib/plan/ahead";
import { fillDueSlot, onSlotDraftReady, planAhead, upcomingPlanSlots } from "@/services/contentPlan";
import { checkLinkedInConnection } from "@/services/linkedinHealth";
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

    // Once a day, a cheap live check of the LinkedIn token, so a lapse is seen before a post fails (task 109).
    await checkLinkedInConnection(client.id, now).catch(() => undefined);

    // Autopilot means autopilot: a drafted slot's post still waiting (held by an older rule, or by a
    // LinkedIn that has since been fixed) is scheduled now (task 121).
    if (!schedule.requireReview) {
      const drafted = await prisma.scheduleSlot.findMany({
        where: { clientId: client.id, status: "DRAFTED", slotAt: { gte: now }, assetId: { not: null } },
        select: { assetId: true },
      });
      const ids = drafted.map((d) => d.assetId).filter((x): x is string => Boolean(x));
      const waitingDrafts = ids.length ? await prisma.asset.findMany({ where: { id: { in: ids }, status: "PENDING_REVIEW" }, select: { id: true } }) : [];
      for (const w of waitingDrafts) await onSlotDraftReady(w.id).catch(() => undefined);
    }

    // The slot due right now (the fallback), then the upcoming slots drafted ahead,
    // so Autopilot has them scheduled before their time.
    const dueNow = computeDueSlot(toScheduleConfig(schedule), client.timezone, now);
    const upcoming = upcomingPlanSlots(schedule, client.timezone, now);
    const handled = await prisma.scheduleSlot.findMany({
      where: { clientId: client.id, slotAt: { in: upcoming }, status: { notIn: ["PLANNED", "HARVESTING"] } },
      select: { slotAt: true },
    });
    // Autopilot has the next 7 days drafted and scheduled; Review first keeps at least the next 3 slots drafted (task 121).
    const ahead = slotsToDraftNow(
      upcoming,
      now,
      new Set(handled.map((h) => h.slotAt.getTime())),
      schedule.requireReview ? { leadHours: DRAFT_LEAD_HOURS, minSlots: REVIEW_MIN_SLOTS } : { leadHours: AUTOPILOT_LEAD_HOURS },
    );
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
