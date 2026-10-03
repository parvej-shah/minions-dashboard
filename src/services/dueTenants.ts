import { prisma } from "@/lib/prisma";
import { computeDueSlot } from "@/lib/scheduling";
import { fillDueSlot, planAhead } from "@/services/contentPlan";
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

    const slot = computeDueSlot(toScheduleConfig(schedule), client.timezone, now);
    if (!slot) continue;

    const limit = monthlyAssetLimit(resolvePlan(client.subscription?.planKey), client.assetsPerMonthOverride);
    if ((await countAssetsThisMonth(client.id)) >= limit) continue;

    const fill = await fillDueSlot(client.id, slot, now);
    if (fill) due.push({ client_id: client.id, slug: client.slug, idea_id: fill.idea_id, slot_id: fill.slot_id, fill_method: fill.method });
  }

  return { due_tenants: due, planned };
}
