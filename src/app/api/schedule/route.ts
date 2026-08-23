import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

const CADENCE_TYPES = ["DAILY", "EVERY_N_DAYS", "DAYS_OF_WEEK"] as const;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

const DEFAULTS = {
  cadence_type: "EVERY_N_DAYS" as const,
  interval_days: 3,
  days_of_week: [] as number[],
  posts_per_day: 1,
  times_of_day: ["09:00"],
  require_review: true,
  is_active: true,
};

/**
 * Real per-tenant posting cadence config -- distinct from the per-idea
 * Idea.scheduledFor/queueOrder fields (PATCH /api/ideas[/id]), which stay a
 * separate manual one-off override. One row per tenant (PostingSchedule.
 * clientId is unique), so unlike /api/channels there's no per-item catalogue
 * to seed -- GET returns computed defaults with exists:false until the
 * tenant actually saves a configuration.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const [schedule, client] = await Promise.all([
      prisma.postingSchedule.findUnique({ where: { clientId: ctx.clientId } }),
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { timezone: true } }),
    ]);

    if (!schedule) {
      return NextResponse.json({ exists: false, timezone: client?.timezone ?? "America/New_York", ...DEFAULTS });
    }

    return NextResponse.json({
      exists: true,
      timezone: client?.timezone ?? "America/New_York",
      cadence_type: schedule.cadenceType,
      interval_days: schedule.intervalDays,
      days_of_week: schedule.daysOfWeek,
      posts_per_day: schedule.postsPerDay,
      times_of_day: schedule.timesOfDay,
      require_review: schedule.requireReview,
      is_active: schedule.isActive,
    });
  } catch (error) {
    return apiError(error, "Failed to load posting schedule");
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();

    const cadenceType = (body.cadence_type || "").toString().trim();
    if (!CADENCE_TYPES.includes(cadenceType as (typeof CADENCE_TYPES)[number])) {
      return apiFailure(`cadence_type must be one of: ${CADENCE_TYPES.join(", ")}`, 400);
    }

    const intervalDays = body.interval_days === null || body.interval_days === undefined ? null : Number(body.interval_days);
    if (cadenceType === "EVERY_N_DAYS" && (!Number.isInteger(intervalDays) || (intervalDays as number) < 1)) {
      return apiFailure("interval_days must be a positive integer when cadence_type is EVERY_N_DAYS", 400);
    }

    const daysOfWeek: unknown = body.days_of_week ?? [];
    if (!Array.isArray(daysOfWeek) || !daysOfWeek.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
      return apiFailure("days_of_week must be an array of integers 0-6", 400);
    }
    if (cadenceType === "DAYS_OF_WEEK" && daysOfWeek.length === 0) {
      return apiFailure("days_of_week must have at least one day when cadence_type is DAYS_OF_WEEK", 400);
    }

    const postsPerDay = Number(body.posts_per_day);
    if (!Number.isInteger(postsPerDay) || postsPerDay < 1) {
      return apiFailure("posts_per_day must be a positive integer", 400);
    }

    const timesOfDay: unknown = body.times_of_day;
    if (!Array.isArray(timesOfDay) || timesOfDay.length !== postsPerDay || !timesOfDay.every((t) => typeof t === "string" && TIME_RE.test(t))) {
      return apiFailure("times_of_day must be an array of \"HH:mm\" strings, one per posts_per_day", 400);
    }

    const requireReview = body.require_review !== false; // default true, matches the schema's safe default
    const isActive = body.is_active !== false;

    const saved = await prisma.postingSchedule.upsert({
      where: { clientId: ctx.clientId },
      update: {
        cadenceType,
        intervalDays: cadenceType === "EVERY_N_DAYS" ? intervalDays : null,
        daysOfWeek: cadenceType === "DAYS_OF_WEEK" ? daysOfWeek : [],
        postsPerDay,
        timesOfDay,
        requireReview,
        isActive,
      },
      create: {
        clientId: ctx.clientId,
        cadenceType,
        intervalDays: cadenceType === "EVERY_N_DAYS" ? intervalDays : null,
        daysOfWeek: cadenceType === "DAYS_OF_WEEK" ? daysOfWeek : [],
        postsPerDay,
        timesOfDay,
        requireReview,
        isActive,
      },
    });

    return NextResponse.json({
      exists: true,
      cadence_type: saved.cadenceType,
      interval_days: saved.intervalDays,
      days_of_week: saved.daysOfWeek,
      posts_per_day: saved.postsPerDay,
      times_of_day: saved.timesOfDay,
      require_review: saved.requireReview,
      is_active: saved.isActive,
    });
  } catch (error) {
    return apiError(error, "Failed to save posting schedule");
  }
}
