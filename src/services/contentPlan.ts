import type { PostingSchedule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextUpcomingSlots } from "@/lib/scheduling";
import { localParts } from "@/lib/pulse/week";
import { utcToZoned } from "@/lib/postTime";
import {
  belowBarNote,
  chooseLane,
  fillSlot,
  HARVEST_WAIT_MINUTES,
  LANE_HISTORY,
  LOOKAHEAD_DAYS,
  OBJECTIVES,
  slotKey,
  type FillMethod,
  type Objective,
  type PlanIdea,
  type PlanLane,
} from "@/lib/plan/fill";
import { startHarvest } from "@/services/harvestRun";
import { toScheduleConfig } from "@/services/postingSchedule";
import { draftingServiceRunning } from "@/services/jobHeartbeat";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { autopilotAllowed } from "@/lib/linkedinHealth";
import { getLinkedInHealth } from "@/services/linkedinHealth";
import { resolveFreeTime } from "@/services/slotBooking";

/**
 * The content plan's slots (phase 7, docs/product/authority-flywheel-plan.md).
 * src/lib/plan/fill.ts decides; this reads and writes the rows.
 *
 * - `planAhead`: the look-ahead. Creates the next 7 days' slots, gives each a
 *   lane, reserves a passing idea, and asks for a targeted harvest early when
 *   a slot has none.
 * - `fillDueSlot`: at a slot's time, the idea 02 should draft.
 * - `onSlotDraftReady`: once that draft's cover is settled, labels a below-bar
 *   draft, or schedules it for the slot's time when the workspace does not require review.
 *
 * Nothing here runs unless the workspace switched the filler on
 * (`posting_schedules.filler_enabled`); `previewWeek` shows the plan without
 * writing anything.
 */

const DRAFTABLE_STATUSES = ["HARVESTED", "REFINED", "QUEUED"];
/** A slot left DRAFTING this long without a draft did not start. */
const DRAFT_START_MINUTES = 30;
const RETRY_NOTE = "Retrying";

const asObjective = (v: string | null | undefined): Objective | null =>
  v && (OBJECTIVES as readonly string[]).includes(v) ? (v as Objective) : null;

/** Whether an instant falls inside the plan's optional date range, in the workspace's timezone. */
function inPlanRange(s: PostingSchedule, at: Date, tz: string): boolean {
  const day = utcToZoned(at, tz).date;
  const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
  const from = iso(s.planStartsOn);
  const to = iso(s.planEndsOn);
  return (!from || day >= from) && (!to || day <= to);
}

/** The pinned lane for this slot, from `slot_lanes`. */
function pinnedLaneFor(s: PostingSchedule, at: Date, tz: string): string | null {
  const map = (s.slotLanes ?? {}) as Record<string, unknown>;
  const key = slotKey(localParts(at, tz).weekday, utcToZoned(at, tz).time);
  return typeof map[key] === "string" ? (map[key] as string) : null;
}

/**
 * A slot's instant on the whole minute. The cadence maths derives slot times
 * from "now", so they carry now's seconds; stored slots are keyed on the
 * instant, and two passes a few seconds apart must name the same slot.
 */
function slotInstant(d: Date): Date {
  return new Date(Math.floor(d.getTime() / 60_000) * 60_000);
}

/** The planned slot instants in the look-ahead window, in order. */
export function upcomingPlanSlots(s: PostingSchedule, tz: string, now: Date): Date[] {
  const until = now.getTime() + LOOKAHEAD_DAYS * 86_400_000;
  const perDay = Math.max(1, s.timesOfDay.length);
  return nextUpcomingSlots(toScheduleConfig(s), tz, perDay * (LOOKAHEAD_DAYS + 1), now)
    .map(slotInstant)
    .filter((d) => d.getTime() <= until && inPlanRange(s, d, tz));
}

interface PlanContext {
  schedule: PostingSchedule;
  tz: string;
  lanes: PlanLane[];
  /** Free ideas: undrafted, unclaimed, draftable. Reservations are applied per slot. */
  ideas: PlanIdea[];
  objectives: { primary: Objective; secondary: Objective | null };
}

async function loadContext(clientId: string): Promise<PlanContext | null> {
  const [schedule, client, lanes, ideas] = await Promise.all([
    prisma.postingSchedule.findUnique({ where: { clientId } }),
    prisma.client.findUnique({ where: { id: clientId }, select: { timezone: true } }),
    prisma.contentLane.findMany({ where: { clientId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.idea.findMany({
      where: { clientId, status: { in: DRAFTABLE_STATUSES }, draftAssetId: null, claimedAt: null },
      select: { id: true, laneId: true, gateVerdict: true, gateReasons: true, scoreBreakdown: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  if (!schedule) return null;
  return {
    schedule,
    tz: client?.timezone ?? DEFAULT_TIMEZONE,
    lanes: lanes.map((l) => ({ id: l.id, name: l.name, purpose: l.purpose, weight: l.weight, sortOrder: l.sortOrder, isActive: l.isActive })),
    ideas: ideas.map((i) => {
      const score = Number((i.scoreBreakdown as { score?: unknown } | null)?.score);
      return { id: i.id, laneId: i.laneId, gateVerdict: i.gateVerdict, gateReasons: i.gateReasons, score: Number.isFinite(score) ? score : 0, createdAt: i.createdAt };
    }),
    objectives: { primary: asObjective(schedule.primaryObjective) ?? "AUTHORITY", secondary: asObjective(schedule.secondaryObjective) },
  };
}

/** Lanes of the slots before `at`, newest first: what the balance counts against. */
async function laneHistory(clientId: string, before: Date): Promise<(string | null)[]> {
  const rows = await prisma.scheduleSlot.findMany({
    where: { clientId, slotAt: { lt: before }, status: { not: "EMPTY" } },
    orderBy: { slotAt: "desc" },
    take: LANE_HISTORY,
    select: { laneId: true },
  });
  return rows.map((r) => r.laneId);
}

/**
 * Settles slots left DRAFTING: links the draft 02 made, or records that none
 * started (the idea was taken, or the run failed) so the slot is not left hanging.
 */
export async function settleDraftingSlots(clientId: string, now: Date): Promise<void> {
  const drafting = await prisma.scheduleSlot.findMany({ where: { clientId, status: "DRAFTING" } });
  for (const slot of drafting) {
    const asset = slot.ideaId ? await prisma.asset.findFirst({ where: { ideaId: slot.ideaId }, select: { id: true } }) : null;
    if (asset) {
      await prisma.scheduleSlot.update({ where: { id: slot.id }, data: { assetId: asset.id, status: "DRAFTED" } });
    } else if (now.getTime() - slot.updatedAt.getTime() > DRAFT_START_MINUTES * 60_000) {
      // A slot still ahead gets one more try with a fresh idea; after that, or once its time has passed, it is given up (task 124).
      const retry = slot.slotAt.getTime() > now.getTime() && !slot.note?.startsWith(RETRY_NOTE);
      await prisma.scheduleSlot.update({
        where: { id: slot.id },
        data: retry
          ? { status: "PLANNED", ideaId: null, fillMethod: null, note: `${RETRY_NOTE}: the first draft did not start.` }
          : { status: "EMPTY", note: "The draft did not start. Draft another idea from the Idea Stream for this slot." },
      });
    }
  }
}

export interface PlanAheadResult {
  slots: number;
  reserved: number;
  harvest_started: boolean;
}

/** The look-ahead: plan, reserve and, where needed, harvest for the next 7 days. */
export async function planAhead(clientId: string, now: Date = new Date()): Promise<PlanAheadResult> {
  const ctx = await loadContext(clientId);
  if (!ctx || !ctx.schedule.fillerEnabled || !ctx.schedule.isActive) return { slots: 0, reserved: 0, harvest_started: false };
  await settleDraftingSlots(clientId, now);

  const instants = upcomingPlanSlots(ctx.schedule, ctx.tz, now);
  const existing = await prisma.scheduleSlot.findMany({ where: { clientId, slotAt: { gte: now } } });
  const byTime = new Map(existing.map((s) => [s.slotAt.getTime(), s]));

  // The schedule changed: future slots no longer in it are dropped (only ones not yet drafting).
  const keep = new Set(instants.map((d) => d.getTime()));
  const stale = existing.filter((s) => !keep.has(s.slotAt.getTime()) && (s.status === "PLANNED" || s.status === "HARVESTING"));
  if (stale.length) await prisma.scheduleSlot.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });

  const free = new Map(ctx.ideas.map((i) => [i.id, i]));
  // Ideas already held by a slot outside this window (or drafting) stay held.
  for (const s of existing) if (s.ideaId && !keep.has(s.slotAt.getTime())) free.delete(s.ideaId);

  const history = await laneHistory(clientId, now);
  const activeLaneIds = ctx.lanes.filter((l) => l.isActive).map((l) => l.id);
  // One targeted harvest at a time per workspace.
  let harvestInFlight = existing.some(
    (s) => s.status === "HARVESTING" && s.harvestRequestedAt && now.getTime() - s.harvestRequestedAt.getTime() < HARVEST_WAIT_MINUTES * 60_000
  );
  let harvestAllowed = true;
  let reserved = 0;
  let harvestStarted = false;

  for (const at of instants) {
    let row = byTime.get(at.getTime());
    const pinned = pinnedLaneFor(ctx.schedule, at, ctx.tz);
    if (!row) {
      const lane = chooseLane(ctx.lanes, history, ctx.objectives, pinned);
      row = await prisma.scheduleSlot.upsert({
        where: { clientId_slotAt: { clientId, slotAt: at } },
        create: { clientId, slotAt: at, laneId: lane?.id ?? null, lanePinned: Boolean(pinned && lane?.id === pinned) },
        update: {},
      });
    } else if (pinned && row.laneId !== pinned && (row.status === "PLANNED" || row.status === "HARVESTING")) {
      row = await prisma.scheduleSlot.update({ where: { id: row.id }, data: { laneId: pinned, lanePinned: true, ideaId: null, fillMethod: null } });
    }
    history.unshift(row.laneId);
    if (row.status !== "PLANNED" && row.status !== "HARVESTING") continue;

    // Keep a reservation while its idea is still free.
    if (row.ideaId && free.has(row.ideaId)) {
      free.delete(row.ideaId);
      continue;
    }

    const decision = fillSlot({
      laneId: row.laneId,
      ideas: [...free.values()],
      activeLaneIds,
      phase: "LOOKAHEAD",
      harvestRequestedAt: row.harvestRequestedAt,
      harvestAllowed: harvestAllowed && !harvestInFlight,
    });

    if (decision.kind === "IDEA") {
      free.delete(decision.ideaId);
      reserved++;
      await prisma.scheduleSlot.update({
        where: { id: row.id },
        data: { ideaId: decision.ideaId, fillMethod: decision.method, gateReasons: decision.reasons, status: "PLANNED", note: null },
      });
    } else if (decision.kind === "HARVEST") {
      const started = await startHarvest(clientId, "PLAN_TARGETED");
      if (started.success) {
        harvestInFlight = true;
        harvestStarted = true;
        await prisma.scheduleSlot.update({
          where: { id: row.id },
          data: { ideaId: null, fillMethod: null, harvestRequestedAt: now, status: "HARVESTING", note: "Looking for ideas for this slot's lane." },
        });
      } else {
        // Out of budget (or n8n refused): below the bar at the slot's time, if nothing better turns up.
        harvestAllowed = false;
      }
    } else {
      // WAIT: nothing yet. A spent harvest goes back to PLANNED.
      const spent = row.status === "HARVESTING" && row.harvestRequestedAt && now.getTime() - row.harvestRequestedAt.getTime() >= HARVEST_WAIT_MINUTES * 60_000;
      await prisma.scheduleSlot.update({
        where: { id: row.id },
        data: { ideaId: null, fillMethod: null, ...(spent ? { status: "PLANNED", note: "No strong idea yet. Add a recent experience to give it one." } : {}) },
      });
    }
  }
  return { slots: instants.length, reserved, harvest_started: harvestStarted };
}

export interface DueFill {
  slot_id: string;
  idea_id: string;
  method: FillMethod;
}

/**
 * At a slot's time: the idea to draft, or null (recorded as EMPTY). With
 * `ahead` (task 108, a day before the slot) only a passing idea is used, and a
 * slot with none is left as it is for the look-ahead and the slot's own time.
 */
export async function fillDueSlot(clientId: string, due: Date, now: Date = new Date(), opts: { ahead?: boolean } = {}): Promise<DueFill | null> {
  const slotAt = slotInstant(due);
  const ctx = await loadContext(clientId);
  if (!ctx || !ctx.schedule.fillerEnabled) return null;

  const pinned = pinnedLaneFor(ctx.schedule, slotAt, ctx.tz);
  let row = await prisma.scheduleSlot.findUnique({ where: { clientId_slotAt: { clientId, slotAt } } });
  if (!row) {
    const lane = chooseLane(ctx.lanes, await laneHistory(clientId, slotAt), ctx.objectives, pinned);
    row = await prisma.scheduleSlot.upsert({
      where: { clientId_slotAt: { clientId, slotAt } },
      create: { clientId, slotAt, laneId: lane?.id ?? null, lanePinned: Boolean(pinned && lane?.id === pinned) },
      update: {},
    });
  }
  if (row.status !== "PLANNED" && row.status !== "HARVESTING") return null; // already handled

  // Ideas held by other slots stay theirs.
  const held = await prisma.scheduleSlot.findMany({
    where: { clientId, id: { not: row.id }, ideaId: { not: null }, status: { in: ["PLANNED", "HARVESTING", "DRAFTING"] } },
    select: { ideaId: true },
  });
  const heldIds = new Set(held.map((h) => h.ideaId));
  const free = ctx.ideas.filter((i) => !heldIds.has(i.id));

  const reservedIdea = row.ideaId ? free.find((i) => i.id === row!.ideaId) : undefined;
  const decision = reservedIdea
    ? { kind: "IDEA" as const, ideaId: reservedIdea.id, method: (row.fillMethod as FillMethod | null) ?? "LANE", reasons: row.gateReasons }
    : fillSlot({
        laneId: row.laneId,
        ideas: free,
        activeLaneIds: ctx.lanes.filter((l) => l.isActive).map((l) => l.id),
        phase: opts.ahead ? "LOOKAHEAD" : "DUE",
        harvestRequestedAt: row.harvestRequestedAt ?? (opts.ahead ? null : now),
        harvestAllowed: false,
      });

  if (decision.kind !== "IDEA" && opts.ahead) return null;
  if (decision.kind !== "IDEA") {
    await prisma.scheduleSlot.update({
      where: { id: row.id },
      data: { status: "EMPTY", ideaId: null, note: "No idea was ready. Run a harvest or add a recent experience so the next slots have one." },
    });
    return null;
  }
  await prisma.scheduleSlot.update({
    where: { id: row.id },
    data: { ideaId: decision.ideaId, fillMethod: decision.method, gateReasons: decision.reasons, status: "DRAFTING", note: row.note?.startsWith(RETRY_NOTE) ? row.note : null },
  });
  return { slot_id: row.id, idea_id: decision.ideaId, method: decision.method };
}

/**
 * The lane a targeted harvest is running for, if any: the harvester then
 * sees only that lane, so every idea it makes is for the slot that asked.
 */
export async function harvestFocusLane(clientId: string, now: Date = new Date()): Promise<string | null> {
  const slot = await prisma.scheduleSlot.findFirst({
    where: {
      clientId,
      status: "HARVESTING",
      harvestRequestedAt: { gte: new Date(now.getTime() - HARVEST_WAIT_MINUTES * 60_000) },
      laneId: { not: null },
    },
    orderBy: { slotAt: "asc" },
    select: { laneId: true },
  });
  return slot?.laneId ?? null;
}

export type SlotDraftOutcome = "NOT_A_SLOT" | "LABELLED" | "SCHEDULED" | "HELD";

/**
 * Called once a draft's cover is settled (drawn or failed). For a slot's draft:
 * a below-bar draft gets its label and, on Review first, waits for review (D17).
 * On Autopilot the draft is scheduled for the slot's time whatever the claims
 * and cover checks say (tasks 108, 121); only a LinkedIn that cannot post holds
 * it. Drafts started by hand are never touched here.
 */
export async function onSlotDraftReady(assetId: string): Promise<SlotDraftOutcome> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, clientId: true, ideaId: true, status: true, claimsOk: true, heroStatus: true, reviewNotes: true },
  });
  if (!asset?.ideaId || !asset.clientId) return "NOT_A_SLOT";
  const slot = await prisma.scheduleSlot.findFirst({
    where: { clientId: asset.clientId, ideaId: asset.ideaId, status: { in: ["DRAFTING", "DRAFTED"] } },
    orderBy: { slotAt: "desc" },
  });
  if (!slot) return "NOT_A_SLOT";
  if (slot.status === "DRAFTING" || slot.assetId !== asset.id) {
    await prisma.scheduleSlot.update({ where: { id: slot.id }, data: { assetId: asset.id, status: "DRAFTED" } });
  }

  const schedule = await prisma.postingSchedule.findUnique({ where: { clientId: asset.clientId }, select: { requireReview: true } });

  // A below-bar draft keeps its label. On Review first it waits (D17); on Autopilot it is
  // scheduled anyway: Autopilot means no review and no checks (task 121).
  if (slot.fillMethod === "BELOW_BAR") {
    const note = belowBarNote(slot.gateReasons);
    if (!asset.reviewNotes.includes(note)) {
      await prisma.asset.update({ where: { id: asset.id }, data: { reviewNotes: [note, ...asset.reviewNotes] } });
    }
    if (!schedule || schedule.requireReview) return "LABELLED";
  }

  if (!schedule || schedule.requireReview || asset.status !== "PENDING_REVIEW") return "HELD";
  // Only a LinkedIn connection that cannot post stops Autopilot; it sends the draft to review instead (task 109).
  if (!autopilotAllowed(await getLinkedInHealth(asset.clientId))) return "HELD";

  // Autopilot approves the draft for the slot's own time: SCHEDULED, released by
  // 03's poll (releaseDuePosts) when due. A slot already past goes out on the next poll.
  // A time another post already holds is booked (task 125): take the next free one.
  const at = await resolveFreeTime(asset.clientId, new Date(Math.max(slot.slotAt.getTime(), Date.now())), asset.id);
  if (!at) return "HELD";
  const scheduled = await prisma.asset.updateMany({
    where: { id: asset.id, status: "PENDING_REVIEW" },
    data: { status: "SCHEDULED", scheduledFor: at, updatedAt: new Date() },
  });
  return scheduled.count === 1 ? "SCHEDULED" : "HELD";
}

export interface WeekSlot {
  slot_at: string;
  lane_id: string | null;
  lane_name: string | null;
  lane_pinned: boolean;
  status: string;
  idea_id: string | null;
  idea_title: string | null;
  fill_method: FillMethod | null;
  gate_reasons: string[];
  asset_id: string | null;
  note: string | null;
  /** True when nothing is stored yet: what the filler would choose now. */
  preview: boolean;
}

/**
 * The next 7 days for the week view. Stored slots as they are; any slot not
 * yet planned (always, while the filler is off) shows what the filler would
 * choose now, without reserving or harvesting.
 */
export async function previewWeek(clientId: string, now: Date = new Date()): Promise<{ timezone: string; filler_enabled: boolean; slots: WeekSlot[] }> {
  const ctx = await loadContext(clientId);
  if (!ctx) return { timezone: DEFAULT_TIMEZONE, filler_enabled: false, slots: [] };

  const instants = upcomingPlanSlots(ctx.schedule, ctx.tz, now);
  const stored = await prisma.scheduleSlot.findMany({
    where: { clientId, slotAt: { gte: new Date(now.getTime() - 86_400_000), lte: new Date(now.getTime() + LOOKAHEAD_DAYS * 86_400_000) } },
    orderBy: { slotAt: "asc" },
  });
  const byTime = new Map(stored.map((s) => [s.slotAt.getTime(), s]));
  const laneName = new Map(ctx.lanes.map((l) => [l.id, l.name]));
  const history = await laneHistory(clientId, now);
  const free = new Map(ctx.ideas.map((i) => [i.id, i]));
  for (const s of stored) if (s.ideaId) free.delete(s.ideaId);
  const activeLaneIds = ctx.lanes.filter((l) => l.isActive).map((l) => l.id);

  const times = new Set([...stored.map((s) => s.slotAt.getTime()), ...instants.map((d) => d.getTime())]);
  const slots: WeekSlot[] = [];
  for (const t of [...times].sort((a, b) => a - b)) {
    const row = byTime.get(t);
    if (row) {
      history.unshift(row.laneId);
      slots.push({
        slot_at: row.slotAt.toISOString(),
        lane_id: row.laneId,
        lane_name: row.laneId ? laneName.get(row.laneId) ?? null : null,
        lane_pinned: row.lanePinned,
        status: row.status,
        idea_id: row.ideaId,
        idea_title: null,
        fill_method: (row.fillMethod as FillMethod | null) ?? null,
        gate_reasons: row.gateReasons,
        asset_id: row.assetId,
        note: row.note,
        preview: false,
      });
      continue;
    }
    const at = new Date(t);
    const pinned = pinnedLaneFor(ctx.schedule, at, ctx.tz);
    const lane = chooseLane(ctx.lanes, history, ctx.objectives, pinned);
    history.unshift(lane?.id ?? null);
    const decision = fillSlot({ laneId: lane?.id ?? null, ideas: [...free.values()], activeLaneIds, phase: "LOOKAHEAD", harvestRequestedAt: null, harvestAllowed: true });
    if (decision.kind === "IDEA") free.delete(decision.ideaId);
    slots.push({
      slot_at: at.toISOString(),
      lane_id: lane?.id ?? null,
      lane_name: lane?.name ?? null,
      lane_pinned: Boolean(pinned && lane?.id === pinned),
      status: decision.kind === "IDEA" ? "PLANNED" : decision.kind === "HARVEST" ? "NEEDS_IDEAS" : "PLANNED",
      idea_id: decision.kind === "IDEA" ? decision.ideaId : null,
      idea_title: null,
      fill_method: decision.kind === "IDEA" ? decision.method : null,
      gate_reasons: decision.kind === "IDEA" ? decision.reasons : [],
      asset_id: null,
      note: decision.kind === "HARVEST" ? "No strong idea in this lane yet. With the filler on, a harvest for it runs ahead of time." : null,
      preview: true,
    });
  }

  const ideaIds = slots.map((s) => s.idea_id).filter((x): x is string => Boolean(x));
  if (ideaIds.length) {
    const titles = await prisma.idea.findMany({ where: { id: { in: ideaIds } }, select: { id: true, angle: true, rawIdea: true } });
    const byId = new Map(titles.map((i) => [i.id, i.angle || i.rawIdea]));
    for (const s of slots) if (s.idea_id) s.idea_title = byId.get(s.idea_id) ?? null;
  }
  return { timezone: ctx.tz, filler_enabled: ctx.schedule.fillerEnabled, slots };
}

/** `onSlotDraftReady` for the cover routes: a failure here never fails the cover. */
export async function settleSlotDraft(assetId: string): Promise<SlotDraftOutcome | null> {
  try {
    return await onSlotDraftReady(assetId);
  } catch (e) {
    console.warn(`[plan] could not settle the slot draft ${assetId}:`, e);
    return null;
  }
}

export async function getPlanStatus(clientId: string) {
  const [schedule, client, service] = await Promise.all([
    prisma.postingSchedule.findUnique({ where: { clientId } }),
    prisma.client.findUnique({ where: { id: clientId }, select: { timezone: true } }),
    draftingServiceRunning(),
  ]);
  const timezone = client?.timezone ?? DEFAULT_TIMEZONE;
  const nextAt = schedule ? (upcomingPlanSlots(schedule, timezone, new Date())[0] ?? null) : null;
  const slot = nextAt
    ? await prisma.scheduleSlot.findUnique({ where: { clientId_slotAt: { clientId, slotAt: nextAt } }, select: { laneId: true } })
    : null;
  const lane = slot?.laneId ? await prisma.contentLane.findUnique({ where: { id: slot.laneId }, select: { name: true } }) : null;

  return {
    exists: Boolean(schedule),
    drafting_on: schedule?.fillerEnabled ?? false,
    service_running: service.running,
    service_last_run_at: service.last_run_at,
    timezone,
    next_slot_at: nextAt?.toISOString() ?? null,
    next_lane_name: lane?.name ?? null,
  };
}
