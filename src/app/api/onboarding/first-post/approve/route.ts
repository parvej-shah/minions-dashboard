import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { DEFAULT_CADENCE, nextUpcomingSlots } from "@/lib/scheduling";
import { MIN_LEAD_MINUTES, utcToZoned } from "@/lib/postTime";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { schedulePost } from "@/services/postSchedule";

/**
 * "Post it" on the first-post reveal: approve the draft into the workspace's
 * next posting slot, so the user makes one decision instead of picking a time.
 * They can move or cancel it from Editorial Studio like any scheduled post.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = (await request.json().catch(() => ({}))) as { asset_id?: unknown };
    const assetId = typeof body.asset_id === "string" ? body.asset_id : "";
    if (!assetId) return apiFailure("asset_id is required", 400);

    const [schedule, client] = await Promise.all([
      prisma.postingSchedule.findUnique({ where: { clientId: ctx.clientId } }),
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { timezone: true } }),
    ]);
    const timezone = client?.timezone ?? DEFAULT_TIMEZONE;
    const cadence = schedule
      ? { ...schedule, isActive: true }
      : { ...DEFAULT_CADENCE, isActive: true, lastRunAt: null, createdAt: new Date() };

    // A slot inside the minimum lead time would be refused; start looking after it.
    const from = new Date(Date.now() + (MIN_LEAD_MINUTES + 5) * 60_000);
    const [slot] = nextUpcomingSlots(cadence, timezone, 1, from);
    if (!slot) return apiFailure("Your schedule has no upcoming slot. Pick a time in Editorial Studio.", 409);

    const { date, time } = utcToZoned(slot, timezone);
    const result = await schedulePost(ctx.clientId, assetId, date, time);
    if (!result.ok) return apiFailure(result.error, result.status);

    return NextResponse.json({ success: true, scheduled_for: result.scheduled_for, timezone });
  } catch (error) {
    return apiError(error, "Could not schedule your post");
  }
}
