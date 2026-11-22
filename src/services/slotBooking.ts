import { prisma } from "@/lib/prisma";
import { nextUpcomingSlots } from "@/lib/scheduling";
import { MIN_LEAD_MINUTES } from "@/lib/postTime";
import { toScheduleConfig } from "@/services/postingSchedule";
import { DEFAULT_TIMEZONE } from "@/constants/config";

/**
 * One post per posting time (task 125). Two scheduled posts at the same
 * minute made the workspace's feed publish in a burst; a time another post
 * already holds counts as booked. Used by the manual Schedule button and by
 * Autopilot, so a stale page or a second draft cannot double-book a time.
 */
const SEARCH_SLOTS = 60;

/**
 * `wanted` if no other scheduled post holds it; otherwise the next posting
 * time after it that is free and at least the minimum lead from `now`.
 * Null when the schedule has no free time left to offer.
 */
export async function resolveFreeTime(clientId: string, wanted: Date, excludeAssetId: string, now: Date = new Date()): Promise<Date | null> {
  const held = await prisma.asset.findMany({
    where: { clientId, status: "SCHEDULED", id: { not: excludeAssetId }, scheduledFor: { not: null } },
    select: { scheduledFor: true },
  });
  const taken = new Set(held.map((a) => a.scheduledFor!.getTime()));
  if (!taken.has(wanted.getTime())) return wanted;

  const [schedule, client] = await Promise.all([
    prisma.postingSchedule.findUnique({ where: { clientId } }),
    prisma.client.findUnique({ where: { id: clientId }, select: { timezone: true } }),
  ]);
  if (!schedule) return null;
  const earliest = Math.max(wanted.getTime(), now.getTime() + MIN_LEAD_MINUTES * 60_000);
  const slots = nextUpcomingSlots(toScheduleConfig(schedule), client?.timezone ?? DEFAULT_TIMEZONE, SEARCH_SLOTS, wanted);
  return slots.find((s) => s.getTime() > wanted.getTime() && s.getTime() >= earliest && !taken.has(s.getTime())) ?? null;
}
