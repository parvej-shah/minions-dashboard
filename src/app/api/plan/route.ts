import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { OBJECTIVES, type Objective } from "@/lib/plan/fill";
import { planAhead, previewWeek } from "@/services/contentPlan";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KEY_RE = /^[1-7]@([01]\d|2[0-3]):[0-5]\d$/;
const isObjective = (v: unknown): v is Objective => typeof v === "string" && (OBJECTIVES as readonly string[]).includes(v);

async function planResponse(clientId: string) {
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
    lanes: lanes.map((l) => ({ id: l.id, name: l.name, purpose: l.purpose, weight: l.weight, is_active: l.isActive })),
    week,
  };
}

/**
 * The content plan (phase 7): objectives, date range, lanes pinned to weekly
 * slots, the slot filler's switch, and the coming week slot by slot.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;
  try {
    return NextResponse.json(await planResponse(ctx.clientId));
  } catch (error) {
    return apiError(error, "Failed to load the content plan");
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json().catch(() => ({}));
    const schedule = await prisma.postingSchedule.findUnique({ where: { clientId: ctx.clientId } });
    if (!schedule) return apiFailure("Save a posting schedule first", 409);

    const data: Record<string, unknown> = {};
    if (body.primary_objective !== undefined) {
      if (!isObjective(body.primary_objective)) return apiFailure(`primary_objective must be one of ${OBJECTIVES.join(", ")}`, 400);
      data.primaryObjective = body.primary_objective;
    }
    if (body.secondary_objective !== undefined) {
      if (body.secondary_objective !== null && !isObjective(body.secondary_objective)) return apiFailure("secondary_objective must be an objective or null", 400);
      data.secondaryObjective = body.secondary_objective;
    }
    const primary = (data.primaryObjective as string | undefined) ?? schedule.primaryObjective;
    const secondary = data.secondaryObjective !== undefined ? (data.secondaryObjective as string | null) : schedule.secondaryObjective;
    if (secondary && secondary === primary) return apiFailure("The secondary objective must differ from the primary one", 400);

    for (const [field, column] of [["plan_starts_on", "planStartsOn"], ["plan_ends_on", "planEndsOn"]] as const) {
      if (body[field] === undefined) continue;
      if (body[field] !== null && !(typeof body[field] === "string" && DATE_RE.test(body[field]))) return apiFailure(`${field} must be YYYY-MM-DD or null`, 400);
      data[column] = body[field] ? new Date(`${body[field]}T00:00:00Z`) : null;
    }
    const starts = data.planStartsOn !== undefined ? (data.planStartsOn as Date | null) : schedule.planStartsOn;
    const ends = data.planEndsOn !== undefined ? (data.planEndsOn as Date | null) : schedule.planEndsOn;
    if (starts && ends && ends < starts) return apiFailure("The plan must end on or after the day it starts", 400);

    if (body.slot_lanes !== undefined) {
      if (typeof body.slot_lanes !== "object" || body.slot_lanes === null || Array.isArray(body.slot_lanes)) return apiFailure("slot_lanes must be an object", 400);
      const laneIds = new Set((await prisma.contentLane.findMany({ where: { clientId: ctx.clientId }, select: { id: true } })).map((l) => l.id));
      const clean: Record<string, string> = {};
      for (const [key, laneId] of Object.entries(body.slot_lanes as Record<string, unknown>)) {
        if (laneId === null || laneId === "") continue;
        if (!KEY_RE.test(key) || typeof laneId !== "string" || !laneIds.has(laneId)) return apiFailure(`Unknown slot or lane: ${key}`, 400);
        clean[key] = laneId;
      }
      data.slotLanes = clean;
    }

    if (body.filler_enabled !== undefined) {
      if (typeof body.filler_enabled !== "boolean") return apiFailure("filler_enabled must be true or false", 400);
      data.fillerEnabled = body.filler_enabled;
    }

    await prisma.postingSchedule.update({ where: { clientId: ctx.clientId }, data });
    // With the filler on, a change is planned right away rather than at the next dispatcher tick.
    const updated = await prisma.postingSchedule.findUnique({ where: { clientId: ctx.clientId }, select: { fillerEnabled: true } });
    if (updated?.fillerEnabled) await planAhead(ctx.clientId);
    return NextResponse.json(await planResponse(ctx.clientId));
  } catch (error) {
    return apiError(error, "Failed to save the content plan");
  }
}
