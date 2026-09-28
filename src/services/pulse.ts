import { prisma } from "@/lib/prisma";
import { chatWithFallback } from "@/lib/ai/modelChain";
import { checkMemory, blockingCodeFindings } from "@/lib/ai/memoryCheck";
import { parseDisclosure, parseMemoryContent, parseMemoryKind } from "@/lib/authorInput";
import { MAX_MEMORY_ITEMS } from "@/constants/contentLanes";
import { renderPulseExtract } from "@/lib/prompts/pulse";
import {
  checkCandidates,
  parseItems,
  PULSE_ANSWER_MAX_CHARS,
  PULSE_ANSWER_MIN_CHARS,
  type ExtractResult,
  type PulseCandidate,
  type PulseFollowups,
} from "@/lib/pulse/extract";
import { isValidTimezone, nextLocalMidnight, pulseState, PULSE_QUESTION, weekStart, type PulseState } from "@/lib/pulse/week";
import type { MemoryCheckResult } from "@/types/author";
import { startHarvest } from "@/services/harvestRun";
import { DEFAULT_TIMEZONE } from "@/constants/config";

/**
 * The weekly question (phase 6 of docs/product/authority-flywheel-plan.md):
 * ask once a week, turn the answer into experience items, and save only the
 * ones the author confirms.
 */

export type CheckedCandidate = PulseCandidate & { check: MemoryCheckResult | null };

export interface PulseDTO {
  state: PulseState["kind"];
  opens_on?: string;
  snoozed_until?: string;
  question: string;
  week_start: string;
  answer: string | null;
  candidates: CheckedCandidate[];
  settings: { enabled: boolean; day: number; timezone: string; timezone_confirmed: boolean };
}

export class PulseError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

async function load(clientId: string, now: Date) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { timezone: true, pulseEnabled: true, pulseDay: true, timezoneConfirmed: true },
  });
  const tz = isValidTimezone(client.timezone) ? client.timezone : DEFAULT_TIMEZONE;
  const week = weekStart(now, tz);
  const row = await prisma.weeklyPulse.findUnique({ where: { clientId_weekStart: { clientId, weekStart: new Date(week) } } });
  return { client, tz, week, row };
}

function toDTO(loaded: Awaited<ReturnType<typeof load>>, now: Date): PulseDTO {
  const { client, tz, week, row } = loaded;
  const state = pulseState(now, tz, { enabled: client.pulseEnabled, day: client.pulseDay }, row);
  return {
    state: state.kind,
    ...(state.kind === "NOT_YET" ? { opens_on: state.opensOn } : {}),
    ...(state.kind === "SNOOZED" ? { snoozed_until: state.until.toISOString() } : {}),
    question: PULSE_QUESTION,
    week_start: week,
    answer: row?.answer ?? null,
    candidates: row?.status === "EXTRACTED" && Array.isArray(row.candidates) ? (row.candidates as unknown as CheckedCandidate[]) : [],
    settings: { enabled: client.pulseEnabled, day: client.pulseDay, timezone: tz, timezone_confirmed: client.timezoneConfirmed },
  };
}

export async function getPulse(clientId: string, now = new Date()): Promise<PulseDTO> {
  return toDTO(await load(clientId, now), now);
}

async function upsert(clientId: string, week: string, data: Record<string, unknown>) {
  await prisma.weeklyPulse.upsert({
    where: { clientId_weekStart: { clientId, weekStart: new Date(week) } },
    create: { clientId, weekStart: new Date(week), status: "SNOOZED", ...data },
    update: data,
  });
}

export async function snoozePulse(clientId: string, now = new Date()): Promise<PulseDTO> {
  const loaded = await load(clientId, now);
  await upsert(clientId, loaded.week, { status: "SNOOZED", snoozedUntil: nextLocalMidnight(now, loaded.tz) });
  return getPulse(clientId, now);
}

export async function skipPulse(clientId: string, now = new Date()): Promise<PulseDTO> {
  const loaded = await load(clientId, now);
  await upsert(clientId, loaded.week, { status: "SKIPPED", snoozedUntil: null, candidates: [] });
  return getPulse(clientId, now);
}

function cleanFollowups(v: unknown): PulseFollowups {
  const f = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const s = (x: unknown) => (typeof x === "string" ? x.trim().slice(0, 500) : "");
  const named = s(f.named).toUpperCase();
  return { problem: s(f.problem), who: s(f.who), named: named === "YES" || named === "NO" ? named : "", evidence: s(f.evidence) };
}

/** One model call; items it proposes are checked in code. Never throws for a model failure. */
export async function extractItems(answer: string, followups: PulseFollowups, icp?: string): Promise<ExtractResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  let content: string | null = null;
  if (apiKey) {
    try {
      const res = await chatWithFallback(renderPulseExtract({ answer, followups, icp }) as unknown as Record<string, unknown>, apiKey);
      if (res.status < 300) content = JSON.parse(res.body)?.choices?.[0]?.message?.content ?? null;
      else console.warn(`[pulse] extraction answered ${res.status}: ${res.body.slice(0, 200)}`);
    } catch (e) {
      console.warn("[pulse] extraction failed:", e);
    }
  }
  return checkCandidates(parseItems(content), answer, followups);
}

export async function answerPulse(clientId: string, body: { answer?: unknown; followups?: unknown }, now = new Date()): Promise<PulseDTO> {
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (answer.length < PULSE_ANSWER_MIN_CHARS) throw new PulseError(`Write at least ${PULSE_ANSWER_MIN_CHARS} characters, so there is something specific to use.`);
  if (answer.length > PULSE_ANSWER_MAX_CHARS) throw new PulseError(`Keep it under ${PULSE_ANSWER_MAX_CHARS} characters.`);

  const loaded = await load(clientId, now);
  const state = toDTO(loaded, now).state;
  if (state === "OFF" || state === "DONE") throw new PulseError("There is no weekly question open right now.", 409);

  const followups = cleanFollowups(body.followups);
  const icp = await prisma.icpProfile.findUnique({ where: { clientId }, select: { who: true } });
  const extracted = await extractItems(answer, followups, icp?.who || undefined);
  if (extracted.dropped.length) console.info(`[pulse] ${clientId}: dropped ${extracted.dropped.length} item(s)`, extracted.dropped);

  // The same privacy check as the Brand page, so the author sees what to fix
  // before saving; the save itself re-runs the blocking floor.
  const candidates: CheckedCandidate[] = await Promise.all(
    extracted.candidates.map(async (c) => ({ ...c, check: await checkMemory(c.content, c.disclosure).catch(() => null) }))
  );

  await upsert(clientId, loaded.week, {
    status: "EXTRACTED",
    snoozedUntil: null,
    answer,
    followups: followups as object,
    candidates: candidates as unknown as object,
  });
  return getPulse(clientId, now);
}

export interface ConfirmResult {
  pulse: PulseDTO;
  saved: number;
  harvest: { started: boolean; message: string } | null;
}

export async function confirmPulse(clientId: string, body: { items?: unknown }, now = new Date()): Promise<ConfirmResult> {
  const loaded = await load(clientId, now);
  if (loaded.row?.status !== "EXTRACTED") throw new PulseError("Answer this week's question first.", 409);

  const raw = Array.isArray(body.items) ? body.items.slice(0, 3) : [];
  const items: { kind: string; content: string; disclosure: string }[] = [];
  for (const r of raw) {
    const item = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    const kind = parseMemoryKind(item.kind);
    const disclosure = parseDisclosure(item.disclosure);
    const content = parseMemoryContent(item.content);
    if (!kind || !disclosure) throw new PulseError("Each item needs a kind and a privacy setting.");
    if (typeof content !== "string") throw new PulseError(content.error);
    // The floor that holds even if the page's check was skipped (decision D4).
    const blocked = blockingCodeFindings(content);
    if (blocked.length) throw new PulseError(`Remove this before saving: ${blocked[0].reason}`);
    items.push({ kind, content, disclosure });
  }

  const count = await prisma.professionalMemory.count({ where: { clientId } });
  if (count + items.length > MAX_MEMORY_ITEMS) {
    throw new PulseError(`You have ${count} experience items; the limit is ${MAX_MEMORY_ITEMS}. Remove old ones on the Brand page first.`);
  }

  const created = await prisma.$transaction(async (tx) => {
    const rows = [];
    for (const i of items) rows.push(await tx.professionalMemory.create({ data: { clientId, ...i, source: "WEEKLY_PULSE" } }));
    await tx.weeklyPulse.update({
      where: { id: loaded.row!.id },
      data: { status: "ANSWERED", memoryIds: rows.map((r) => r.id), answeredAt: now, candidates: [] },
    });
    return rows;
  });

  // Ideas from this week's update now, not at the nightly run.
  let harvest: ConfirmResult["harvest"] = null;
  if (created.length) {
    try {
      const h = await startHarvest(clientId, "WEEKLY_PULSE");
      harvest = { started: h.success, message: h.message };
    } catch (e) {
      console.warn("[pulse] harvest trigger failed:", e);
      harvest = { started: false, message: "Saved. New ideas will come from the nightly harvest." };
    }
  }
  return { pulse: await getPulse(clientId, now), saved: created.length, harvest };
}

export async function updatePulseSettings(
  clientId: string,
  body: { enabled?: unknown; day?: unknown; timezone?: unknown; timezone_confirmed?: unknown }
): Promise<PulseDTO> {
  const data: { pulseEnabled?: boolean; pulseDay?: number; timezone?: string; timezoneConfirmed?: boolean } = {};
  if (typeof body.enabled === "boolean") data.pulseEnabled = body.enabled;
  if (body.day !== undefined) {
    const day = Number(body.day);
    if (!Number.isInteger(day) || day < 1 || day > 7) throw new PulseError("day must be 1 (Monday) to 7 (Sunday).");
    data.pulseDay = day;
  }
  if (body.timezone !== undefined) {
    const tz = typeof body.timezone === "string" ? body.timezone.trim() : "";
    if (!isValidTimezone(tz)) throw new PulseError("That is not a timezone this browser knows.");
    data.timezone = tz;
    data.timezoneConfirmed = true;
  }
  if (body.timezone_confirmed === true) data.timezoneConfirmed = true;
  await prisma.client.update({ where: { id: clientId }, data });
  return getPulse(clientId);
}

export interface PulseHistoryItem {
  week_start: string;
  status: string;
  answer: string | null;
  memories: { id: string; kind: string; content: string; is_active: boolean }[];
}

export async function pulseHistory(clientId: string): Promise<PulseHistoryItem[]> {
  const rows = await prisma.weeklyPulse.findMany({
    where: { clientId, status: { in: ["ANSWERED", "SKIPPED"] } },
    orderBy: { weekStart: "desc" },
    take: 12,
  });
  const ids = rows.flatMap((r) => r.memoryIds);
  const memories = ids.length
    ? await prisma.professionalMemory.findMany({ where: { clientId, id: { in: ids } }, select: { id: true, kind: true, content: true, isActive: true } })
    : [];
  const byId = new Map(memories.map((m) => [m.id, m]));
  return rows.map((r) => ({
    week_start: r.weekStart.toISOString().slice(0, 10),
    status: r.status,
    answer: r.answer,
    memories: r.memoryIds
      .map((id) => byId.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => ({ id: m.id, kind: m.kind, content: m.content, is_active: m.isActive })),
  }));
}
