import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { nextUpcomingSlots } from "@/lib/scheduling";
import { DEFAULT_TIMEZONE } from "@/constants/config";

/** Read-only "upcoming posting slots" list for the /settings/schedule UI --
 * computed from the stored cadence rule, not stored as individual rows. */
export async function GET(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { searchParams } = new URL(request.url);
    const count = Math.min(Math.max(Number(searchParams.get("count")) || 10, 1), 30);

    const [schedule, client] = await Promise.all([
      prisma.postingSchedule.findUnique({ where: { clientId: ctx.clientId } }),
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { timezone: true } }),
    ]);

    if (!schedule) {
      return NextResponse.json({ slots: [] });
    }

    const timezone = client?.timezone ?? DEFAULT_TIMEZONE;
    const slots = nextUpcomingSlots(
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
      timezone,
      count
    );

    return NextResponse.json({ slots: slots.map((d) => d.toISOString()) });
  } catch (error) {
    return apiError(error, "Failed to compute upcoming posting slots");
  }
}
