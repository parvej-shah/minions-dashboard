import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { schedulePost, unschedulePost } from "@/services/postSchedule";

/**
 * Approve a reviewed draft to go out at a chosen time (phase 7). The body is a
 * local date and time in the workspace's timezone: `{ date: "2026-09-28",
 * time: "09:00" }`. Calling it again on a scheduled post moves it.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";
    if (!date || !time) return apiFailure("date (YYYY-MM-DD) and time (HH:mm) are required", 400);

    const result = await schedulePost(ctx.clientId, id, date, time);
    if (!result.ok) return apiFailure(result.error, result.status);
    return NextResponse.json({ success: true, status: result.status, scheduled_for: result.scheduled_for });
  } catch (error) {
    return apiError(error, "Failed to schedule the post");
  }
}

/** Cancel a scheduled post: it goes back to review and goes nowhere until approved again. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const result = await unschedulePost(ctx.clientId, id);
    if (!result.ok) return apiFailure(result.error, result.status);
    return NextResponse.json({ success: true, status: result.status, scheduled_for: null });
  } catch (error) {
    return apiError(error, "Failed to cancel the schedule");
  }
}
