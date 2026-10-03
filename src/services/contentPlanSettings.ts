import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { OBJECTIVES, type Objective } from "@/lib/plan/fill";
import { planAhead, previewWeek } from "@/services/contentPlan";
import type { JsonObject } from "@/server/http/body";
import { badRequest, conflict } from "@/server/http/errors";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_KEY_PATTERN = /^[1-7]@([01]\d|2[0-3]):[0-5]\d$/;
const PLAN_DATE_FIELDS = [
  ["plan_starts_on", "planStartsOn"],
  ["plan_ends_on", "planEndsOn"],
] as const;

const isObjective = (value: unknown): value is Objective =>
  typeof value === "string" && (OBJECTIVES as readonly string[]).includes(value);

export async function getContentPlan(clientId: string) {
  const [schedule, lanes, week] = await Promise.all([
    prisma.postingSchedule.findUnique({ where: { clientId } }),
    prisma.contentLane.findMany({ where: { clientId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    previewWeek(clientId),
  ]);
  return {
    exists: Boolean(schedule),
    filler_enabled: schedule?.fillerEnabled ?? false,
    require_review: schedule?.requireReview ?? true,
    primary_objective: schedule?.primaryObjective ?? "AUTHORITY",
    secondary_objective: schedule?.secondaryObjective ?? null,
    plan_starts_on: schedule?.planStartsOn?.toISOString().slice(0, 10) ?? null,
    plan_ends_on: schedule?.planEndsOn?.toISOString().slice(0, 10) ?? null,
    slot_lanes: (schedule?.slotLanes ?? {}) as Record<string, string>,
    times_of_day: schedule?.timesOfDay ?? [],
    lanes: lanes.map((lane) => ({ id: lane.id, name: lane.name, purpose: lane.purpose, weight: lane.weight, is_active: lane.isActive })),
    week,
  };
}

function objectiveChanges(body: JsonObject, current: { primaryObjective: string; secondaryObjective: string | null }) {
  const changes: Prisma.PostingScheduleUpdateInput = {};
  if (body.primary_objective !== undefined) {
    if (!isObjective(body.primary_objective)) throw badRequest(`primary_objective must be one of ${OBJECTIVES.join(", ")}`);
    changes.primaryObjective = body.primary_objective;
  }
  if (body.secondary_objective !== undefined) {
    if (body.secondary_objective !== null && !isObjective(body.secondary_objective)) {
      throw badRequest("secondary_objective must be an objective or null");
    }
    changes.secondaryObjective = body.secondary_objective;
  }
  const primary = (changes.primaryObjective as string | undefined) ?? current.primaryObjective;
  const secondary = changes.secondaryObjective !== undefined ? (changes.secondaryObjective as string | null) : current.secondaryObjective;
  if (secondary && secondary === primary) throw badRequest("The secondary objective must differ from the primary one");
  return changes;
}

function dateRangeChanges(body: JsonObject, current: { planStartsOn: Date | null; planEndsOn: Date | null }) {
  const changes: Record<string, Date | null> = {};
  for (const [field, column] of PLAN_DATE_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    if (value !== null && !(typeof value === "string" && DATE_PATTERN.test(value))) throw badRequest(`${field} must be YYYY-MM-DD or null`);
    changes[column] = value ? new Date(`${value}T00:00:00Z`) : null;
  }
  const starts = changes.planStartsOn !== undefined ? changes.planStartsOn : current.planStartsOn;
  const ends = changes.planEndsOn !== undefined ? changes.planEndsOn : current.planEndsOn;
  if (starts && ends && ends < starts) throw badRequest("The plan must end on or after the day it starts");
  return changes;
}

async function slotLaneChanges(clientId: string, slotLanes: unknown) {
  if (typeof slotLanes !== "object" || slotLanes === null || Array.isArray(slotLanes)) throw badRequest("slot_lanes must be an object");
  const laneIds = new Set((await prisma.contentLane.findMany({ where: { clientId }, select: { id: true } })).map((lane) => lane.id));
  const clean: Record<string, string> = {};
  for (const [key, laneId] of Object.entries(slotLanes as Record<string, unknown>)) {
    if (laneId === null || laneId === "") continue;
    if (!SLOT_KEY_PATTERN.test(key) || typeof laneId !== "string" || !laneIds.has(laneId)) throw badRequest(`Unknown slot or lane: ${key}`);
    clean[key] = laneId;
  }
  return clean;
}

export async function updateContentPlan(clientId: string, body: JsonObject) {
  const schedule = await prisma.postingSchedule.findUnique({ where: { clientId } });
  if (!schedule) throw conflict("Save a posting schedule first");

  const data: Prisma.PostingScheduleUpdateInput = {
    ...objectiveChanges(body, schedule),
    ...dateRangeChanges(body, schedule),
  };
  if (body.slot_lanes !== undefined) data.slotLanes = await slotLaneChanges(clientId, body.slot_lanes);
  if (body.filler_enabled !== undefined) {
    if (typeof body.filler_enabled !== "boolean") throw badRequest("filler_enabled must be true or false");
    data.fillerEnabled = body.filler_enabled;
    if (body.filler_enabled) data.isActive = true;
  }

  const updated = await prisma.postingSchedule.update({ where: { clientId }, data, select: { fillerEnabled: true } });
  if (updated.fillerEnabled) await planAhead(clientId);
  return getContentPlan(clientId);
}
