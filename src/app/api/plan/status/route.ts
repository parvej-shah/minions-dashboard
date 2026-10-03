import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { upcomingPlanSlots } from "@/services/contentPlan";
import { draftingServiceRunning } from "@/services/jobHeartbeat";
import { DEFAULT_TIMEZONE } from "@/constants/config";

/**
 * The one-line answer to "is anything drafting on its own here?" for the top
 * of Settings > Schedule: this workspace's switch, whether the drafting job
 * (00b) has actually been running (from its check-ins, not a setting), and the
 * next slot it would draft.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const [schedule, client, service] = await Promise.all([
      prisma.postingSchedule.findUnique({ where: { clientId: ctx.clientId } }),
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { timezone: true } }),
      draftingServiceRunning(),
    ]);
    const tz = client?.timezone ?? DEFAULT_TIMEZONE;
    const nextAt = schedule ? upcomingPlanSlots(schedule, tz, new Date())[0] ?? null : null;
    const slot = nextAt
      ? await prisma.scheduleSlot.findUnique({ where: { clientId_slotAt: { clientId: ctx.clientId, slotAt: nextAt } }, select: { laneId: true } })
      : null;
    const lane = slot?.laneId ? await prisma.contentLane.findUnique({ where: { id: slot.laneId }, select: { name: true } }) : null;

    return NextResponse.json({
      exists: Boolean(schedule),
      drafting_on: schedule?.fillerEnabled ?? false,
      service_running: service.running,
      service_last_run_at: service.last_run_at,
      timezone: tz,
      next_slot_at: nextAt?.toISOString() ?? null,
      next_lane_name: lane?.name ?? null,
    });
  } catch (e) {
    return apiError(e, "Could not load the drafting status");
  }
}
