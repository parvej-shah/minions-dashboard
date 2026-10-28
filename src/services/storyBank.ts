import { badRequest } from "@/server/http/errors";
import { prisma } from "@/lib/prisma";
import { checkMemory } from "@/lib/ai/memoryCheck";
import { PULSE_ANSWER_MAX_CHARS, PULSE_ANSWER_MIN_CHARS } from "@/lib/pulse/extract";
import { isValidTimezone, weekStart } from "@/lib/pulse/week";
import { bankLevel, pickPrompts, promptById, streakWeeks, STREAK_SOURCES, type BankLevel, type StoryPrompt } from "@/lib/storyBank";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { extractItems, parseConfirmedItems, type CheckedCandidate } from "@/services/pulse";
import { startHarvest } from "@/services/harvestRun";

/**
 * The story bank card and its quick session (see src/lib/storyBank.ts). The
 * session asks one question at a time, turns each answer into items the
 * author confirms (the same extraction and checks as the weekly question),
 * saves them as the author goes, and starts one harvest at the end.
 */

/** The same window the harvest counts memory use over (getHarvestContext). */
const RECENT_IDEAS = 60;
/** Weeks read back for the streak. */
const STREAK_WEEKS = 26;
/** A session's closing harvest runs only if it saved something this recently. */
const SESSION_MINUTES = 60;

export interface StoryBankDTO extends BankLevel {
  streak_weeks: number;
  /** The author already added something this week, so a session does not grow the streak. */
  added_this_week: boolean;
  prompts: StoryPrompt[];
}

export async function getStoryBank(clientId: string, now = new Date()): Promise<StoryBankDTO> {
  const since = new Date(now.getTime() - STREAK_WEEKS * 7 * 86_400_000);
  const [client, active, recent, added] = await Promise.all([
    prisma.client.findUniqueOrThrow({ where: { id: clientId }, select: { timezone: true } }),
    prisma.professionalMemory.findMany({ where: { clientId, isActive: true }, select: { id: true, kind: true } }),
    prisma.idea.findMany({
      // The same ideas the harvest counts: gate-dropped ones were never produced.
      where: { clientId, OR: [{ gateVerdict: null }, { gateVerdict: { not: "REJECT" } }] },
      orderBy: { createdAt: "desc" },
      take: RECENT_IDEAS,
      select: { memoryIds: true },
    }),
    prisma.professionalMemory.findMany({
      where: { clientId, source: { in: [...STREAK_SOURCES] }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);
  const tz = isValidTimezone(client.timezone) ? client.timezone : DEFAULT_TIMEZONE;
  const thisWeek = weekStart(now, tz);
  const weeks = new Set(added.map((m) => weekStart(m.createdAt, tz)));

  const counts: Record<string, number> = {};
  for (const m of active) counts[m.kind] = (counts[m.kind] ?? 0) + 1;
  // Same questions all day, new ones tomorrow.
  const daySeed = Math.floor(now.getTime() / 86_400_000);

  return {
    ...bankLevel(
      active.map((m) => m.id),
      recent.map((i) => i.memoryIds)
    ),
    streak_weeks: streakWeeks(weeks, thisWeek),
    added_this_week: weeks.has(thisWeek),
    prompts: pickPrompts(counts, daySeed),
  };
}

export interface StoryExtractDTO {
  candidates: CheckedCandidate[];
}

/** One answer in, up to three checked items out. Nothing is saved. */
export async function extractStory(clientId: string, body: { prompt_id?: unknown; answer?: unknown }): Promise<StoryExtractDTO> {
  const prompt = promptById(body.prompt_id);
  if (!prompt) throw badRequest("Unknown question.");
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (answer.length < PULSE_ANSWER_MIN_CHARS) throw badRequest(`Write at least ${PULSE_ANSWER_MIN_CHARS} characters, so there is something specific to use.`);
  if (answer.length > PULSE_ANSWER_MAX_CHARS) throw badRequest(`Keep it under ${PULSE_ANSWER_MAX_CHARS} characters.`);

  const icp = await prisma.icpProfile.findUnique({ where: { clientId }, select: { who: true } });
  const extracted = await extractItems(answer, {}, icp?.who || undefined, prompt.question);
  if (extracted.dropped.length) console.info(`[story-bank] ${clientId}: dropped ${extracted.dropped.length} item(s)`, extracted.dropped);
  // The answer offered as-is keeps the kind the question asked for.
  const items = extracted.fallback ? extracted.candidates.map((c) => ({ ...c, kind: prompt.kind })) : extracted.candidates;
  const candidates = await Promise.all(items.map(async (c) => ({ ...c, check: await checkMemory(c.content, c.disclosure).catch(() => null) })));
  return { candidates };
}

/** Posts or notes pasted in one go: longer than an answer, a few posts' worth. */
export const PASTE_MAX_CHARS = 6000;
const PASTE_QUESTION = "Paste 2-3 posts or notes you have written before. Keep only what the author did, saw or learned, not general advice.";
/** The writer copies the voice of a few samples; more than this adds nothing. */
const MAX_VOICE_SAMPLES = 3;

/** Posts or notes the author wrote before, in for the same checked items as an answer. Nothing is saved. */
export async function extractPaste(clientId: string, body: { text?: unknown }): Promise<StoryExtractDTO> {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < PULSE_ANSWER_MIN_CHARS) throw badRequest("Paste at least one post or note, so there is something to work from.");
  if (text.length > PASTE_MAX_CHARS) throw badRequest(`Keep it under ${PASTE_MAX_CHARS} characters, about three posts.`);

  const icp = await prisma.icpProfile.findUnique({ where: { clientId }, select: { who: true } });
  const extracted = await extractItems(text, {}, icp?.who || undefined, PASTE_QUESTION);
  if (extracted.dropped.length) console.info(`[story-bank] ${clientId}: dropped ${extracted.dropped.length} pasted item(s)`, extracted.dropped);
  const candidates = await Promise.all(extracted.candidates.map(async (c) => ({ ...c, check: await checkMemory(c.content, c.disclosure).catch(() => null) })));
  return { candidates };
}

/**
 * Saves the items the author kept from one answer. Pasted posts (`sample`) are
 * also kept as a voice sample while the workspace has fewer than three.
 */
export async function saveStories(clientId: string, body: { items?: unknown; sample?: unknown }): Promise<{ saved: number }> {
  const items = await parseConfirmedItems(clientId, body.items);
  if (!items.length) return { saved: 0 };
  await prisma.professionalMemory.createMany({ data: items.map((i) => ({ clientId, ...i, source: "BRAND_PAGE" })) });
  const sample = typeof body.sample === "string" ? body.sample.trim().slice(0, PASTE_MAX_CHARS) : "";
  if (sample.length >= PULSE_ANSWER_MIN_CHARS && (await prisma.toneExample.count({ where: { clientId } })) < MAX_VOICE_SAMPLES) {
    await prisma.toneExample.create({ data: { clientId, content: sample, source: "pasted" } });
  }
  return { saved: items.length };
}

/** Ideas from the new stories now, not at the nightly run. */
export async function finishSession(clientId: string, now = new Date()): Promise<{ started: boolean; message: string }> {
  const recent = await prisma.professionalMemory.count({
    where: { clientId, source: "BRAND_PAGE", createdAt: { gte: new Date(now.getTime() - SESSION_MINUTES * 60_000) } },
  });
  if (!recent) return { started: false, message: "Nothing new to build ideas from yet." };
  try {
    const h = await startHarvest(clientId, "STORY_SESSION");
    return { started: h.success, message: h.message };
  } catch (e) {
    console.warn("[story-bank] harvest trigger failed:", e);
    return { started: false, message: "Saved. New ideas will come from the nightly harvest." };
  }
}
