import type { PostingSchedule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CADENCE, nextUpcomingSlots } from "@/lib/scheduling";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { assertNotEstablished } from "@/services/onboardingGuard";
import type { JsonObject } from "@/server/http/body";
import { asString } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { autopilotAllowed, AUTOPILOT_NEEDS_LINKEDIN } from "@/lib/linkedinHealth";
import { getLinkedInHealth } from "@/services/linkedinHealth";

const CADENCE_TYPES = ["DAILY", "EVERY_N_DAYS", "DAYS_OF_WEEK"];
const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DEFAULT_PREVIEW_COUNT = 10;
const MAX_PREVIEW_COUNT = 30;

const DEFAULTS = {
  cadence_type: DEFAULT_CADENCE.cadenceType,
  interval_days: DEFAULT_CADENCE.intervalDays,
  days_of_week: DEFAULT_CADENCE.daysOfWeek,
  posts_per_day: DEFAULT_CADENCE.postsPerDay,
  times_of_day: DEFAULT_CADENCE.timesOfDay,
  require_review: true,
  is_active: true,
};

export function toScheduleConfig(schedule: PostingSchedule) {
  return {
    cadenceType: schedule.cadenceType,
    intervalDays: schedule.intervalDays,
    daysOfWeek: schedule.daysOfWeek,
    postsPerDay: schedule.postsPerDay,
    timesOfDay: schedule.timesOfDay,
    isActive: schedule.isActive,
    lastRunAt: schedule.lastRunAt,
    createdAt: schedule.createdAt,
  };
}

const toScheduleDTO = (schedule: PostingSchedule) => ({
  exists: true,
  cadence_type: schedule.cadenceType,
  interval_days: schedule.intervalDays,
  days_of_week: schedule.daysOfWeek,
  posts_per_day: schedule.postsPerDay,
  times_of_day: schedule.timesOfDay,
  require_review: schedule.requireReview,
  is_active: schedule.isActive,
  created_at: schedule.createdAt.toISOString(),
});

async function loadScheduleAndTimezone(clientId: string) {
  const [schedule, client] = await Promise.all([
    prisma.postingSchedule.findUnique({ where: { clientId } }),
    prisma.client.findUnique({ where: { id: clientId }, select: { timezone: true } }),
  ]);
  return { schedule, timezone: client?.timezone ?? DEFAULT_TIMEZONE };
}

export async function getScheduleSettings(clientId: string) {
  const { schedule, timezone } = await loadScheduleAndTimezone(clientId);
  const linkedin = await getLinkedInHealth(clientId);
  return schedule ? { ...toScheduleDTO(schedule), timezone, linkedin } : { exists: false, timezone, ...DEFAULTS, linkedin };
}

function parseScheduleInput(body: JsonObject) {
  const cadenceType = asString(body.cadence_type);
  if (!CADENCE_TYPES.includes(cadenceType)) throw badRequest(`cadence_type must be one of: ${CADENCE_TYPES.join(", ")}`);

  const intervalDays = body.interval_days === null || body.interval_days === undefined ? null : Number(body.interval_days);
  if (cadenceType === "EVERY_N_DAYS" && (!Number.isInteger(intervalDays) || (intervalDays as number) < 1)) {
    throw badRequest("interval_days must be a positive integer when cadence_type is EVERY_N_DAYS");
  }

  const daysOfWeek: unknown = body.days_of_week ?? [];
  if (!Array.isArray(daysOfWeek) || !daysOfWeek.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) {
    throw badRequest("days_of_week must be an array of integers 0-6");
  }
  if (cadenceType === "DAYS_OF_WEEK" && daysOfWeek.length === 0) {
    throw badRequest("days_of_week must have at least one day when cadence_type is DAYS_OF_WEEK");
  }

  const postsPerDay = Number(body.posts_per_day);
  if (!Number.isInteger(postsPerDay) || postsPerDay < 1) throw badRequest("posts_per_day must be a positive integer");

  const timesOfDay: unknown = body.times_of_day;
  if (!Array.isArray(timesOfDay) || timesOfDay.length !== postsPerDay || !timesOfDay.every((time) => typeof time === "string" && TIME_PATTERN.test(time))) {
    throw badRequest('times_of_day must be an array of "HH:mm" strings, one per posts_per_day');
  }

  return {
    cadenceType,
    intervalDays: cadenceType === "EVERY_N_DAYS" ? intervalDays : null,
    daysOfWeek: cadenceType === "DAYS_OF_WEEK" ? (daysOfWeek as number[]) : [],
    postsPerDay,
    timesOfDay: timesOfDay as string[],
    requireReview: body.require_review !== false,
    isActive: body.is_active !== false,
  };
}

export async function saveScheduleSettings(clientId: string, body: JsonObject) {
  if (body.from_onboarding === true) await assertNotEstablished(clientId);
  const data = parseScheduleInput(body);
  // Autopilot posts to LinkedIn unseen, so it needs a working connection (task 109).
  // Turning it off, or leaving it as it was, is always allowed.
  if (!data.requireReview) {
    const current = await prisma.postingSchedule.findUnique({ where: { clientId }, select: { requireReview: true } });
    if ((current?.requireReview ?? true) && !autopilotAllowed(await getLinkedInHealth(clientId))) throw badRequest(AUTOPILOT_NEEDS_LINKEDIN);
  }
  const saved = await prisma.postingSchedule.upsert({
    where: { clientId },
    // Drafting is not optional: saving a pace turns it on (task 129).
    update: { ...data, fillerEnabled: true },
    create: { clientId, ...data, fillerEnabled: true },
  });
  return toScheduleDTO(saved);
}

export async function previewSlots(clientId: string, requested: number) {
  const count = Math.min(Math.max(requested || DEFAULT_PREVIEW_COUNT, 1), MAX_PREVIEW_COUNT);
  const { schedule, timezone } = await loadScheduleAndTimezone(clientId);
  if (!schedule) return { slots: [] };
  return { slots: nextUpcomingSlots(toScheduleConfig(schedule), timezone, count).map((slot) => slot.toISOString()) };
}
