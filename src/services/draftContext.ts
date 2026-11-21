import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { checkMemory } from "@/lib/ai/memoryCheck";
import { generalizedText } from "@/lib/drafts/generalize";
import { buildDraftAuthorContext, emptyDraftContext, manualIdeaNote, noteDraftContext, type DraftAuthorContext, type DraftMemory } from "@/lib/drafts/authorContext";
import { writerExpertisePromptGuidance } from "@/constants/writerExpertise";
import { toIcpContext, EMPTY_ICP } from "@/services/authorContext";
import { parseBrandProof } from "@/lib/brand-proof";
import { STARTER_TAG } from "@/lib/starterSet";
import { lastParagraph } from "@/lib/drafts/openingRepeats";
import { closeFor, modeFor } from "@/lib/drafts/strategy";

const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 32);

/**
 * The GENERALIZE text for a memory item, computed once per edit and cached on
 * the row (generalized_content, keyed by a hash of the content it came from).
 */
async function generalizedFor(m: { id: string; content: string; generalizedContent: string | null; generalizedSourceHash: string | null }): Promise<string> {
  const h = hash(m.content);
  if (m.generalizedContent && m.generalizedSourceHash === h) return m.generalizedContent;
  const check = await checkMemory(m.content, "GENERALIZE").catch(() => null);
  const { text } = generalizedText(m.content, check?.generalized);
  await prisma.professionalMemory.update({ where: { id: m.id }, data: { generalizedContent: text, generalizedSourceHash: h } }).catch(() => null);
  return text;
}

/** How far back "recently posted" reaches, and how many arguments it lists. */
const RECENT_DAYS = 21;
const RECENT_MAX = 8;

const oneLine = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/**
 * The arguments and first lines of the workspace's recent drafts, newest
 * first, so the next one makes a new point and opens a new way.
 */
async function recentDrafts(clientId: string, ideaId: string): Promise<{ posts: string[]; openings: string[] }> {
  const rows = await prisma.asset.findMany({
    where: { clientId, ideaId: { not: ideaId }, createdAt: { gte: new Date(Date.now() - RECENT_DAYS * 86_400_000) } },
    orderBy: { createdAt: "desc" },
    take: RECENT_MAX,
    select: { title: true, coreArgument: true, hook: true },
  });
  return {
    posts: rows.map((r) => oneLine(r.coreArgument) || oneLine(r.title)).filter(Boolean),
    openings: rows.map((r) => oneLine(r.hook)).filter(Boolean),
  };
}

/**
 * The first lines (hooks) and LinkedIn closing lines of the workspace's recent
 * drafts, for the cross-post check in src/services/draftPolish.ts.
 */
export async function recentPostLines(clientId: string): Promise<{ openings: string[]; closings: string[] }> {
  const rows = await prisma.asset.findMany({
    where: { clientId, createdAt: { gte: new Date(Date.now() - RECENT_DAYS * 86_400_000) } },
    orderBy: { createdAt: "desc" },
    take: RECENT_MAX,
    select: { hook: true, linkedinVariant: true },
  });
  return {
    openings: rows.map((r) => oneLine(r.hook)).filter(Boolean),
    closings: rows.map((r) => oneLine(lastParagraph(r.linkedinVariant ?? ""))).filter(Boolean),
  };
}

export async function getDraftAuthorContext(clientId: string, ideaId: string): Promise<DraftAuthorContext> {
  const [idea, icpRow, profile, recentRows, postCount] = await Promise.all([
    prisma.idea.findFirst({ where: { id: ideaId, clientId }, include: { lane: true } }),
    prisma.icpProfile.findUnique({ where: { clientId } }),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { writerExpertise: true } }),
    recentDrafts(clientId, ideaId).catch(() => ({ posts: [], openings: [] })),
    prisma.asset.count({ where: { clientId } }).catch(() => 0),
  ]);
  // The opening walks its list by post count; the first-login set keeps the
  // openings it planned (src/lib/starterSet.ts), since its posts draft at once.
  const starter = !!idea?.tags?.includes(STARTER_TAG);
  const turn = starter ? 0 : postCount;
  const recent = { recent_posts: recentRows.posts, recent_openings: recentRows.openings };
  // The body's shape and the close rotate the same way (phase 4); the starter set planned its own.
  const finish = (ctx: DraftAuthorContext): DraftAuthorContext =>
    starter ? { ...ctx, ...recent } : { ...ctx, ...recent, mode_hint: modeFor(ctx.allowed_modes, turn), close: closeFor(turn) };
  const icp = icpRow ? toIcpContext(icpRow) : EMPTY_ICP;
  const standing = writerExpertisePromptGuidance(profile?.writerExpertise);
  const note = idea ? manualIdeaNote(idea) : null;
  if (idea && note) {
    const lane = idea.lane ? { name: idea.lane.name, purpose: idea.lane.purpose, brief: idea.lane.brief } : null;
    return finish(noteDraftContext(note, icp, standing, lane, turn));
  }
  if (!idea || !idea.gateVerdict) return finish(emptyDraftContext(icp, standing, idea?.pillar, turn));

  // Inactive items stay out: switching one off means "do not use this".
  const rows = idea.memoryIds.length
    ? await prisma.professionalMemory.findMany({ where: { clientId, id: { in: idea.memoryIds }, isActive: true } })
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const memory: DraftMemory[] = [];
  for (const id of idea.memoryIds) {
    const m = byId.get(id);
    if (!m) continue;
    const generalize = m.disclosure === "GENERALIZE";
    memory.push({ kind: m.kind, disclosure: generalize ? "GENERALIZE" : "PUBLIC", text: generalize ? await generalizedFor(m) : m.content });
  }
  const lane = idea.lane ? { name: idea.lane.name, purpose: idea.lane.purpose, brief: idea.lane.brief } : null;
  return finish(buildDraftAuthorContext(idea, memory, icp, lane, standing, turn));
}

/** What the draft check needs beyond the author context: the verified proof and the original memory. */
export async function getDraftCheckInputs(clientId: string, ideaId: string) {
  const [idea, profile, proofRows] = await Promise.all([
    prisma.idea.findFirst({ where: { id: ideaId, clientId }, select: { memoryIds: true, rawIdea: true, angle: true, why: true, icpProblem: true, authorAdvantage: true, signals: true, trustBasis: true, source: true, gateVerdict: true } }),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { allowedProofClaims: true, allowCustomerResultClaims: true, positioning: true } }),
    prisma.brandDirective.findMany({ where: { clientId, isActive: true, category: "PROOF" }, select: { instruction: true } }),
  ]);
  const memory = idea?.memoryIds.length
    ? await prisma.professionalMemory.findMany({ where: { clientId, id: { in: idea.memoryIds } }, select: { content: true, disclosure: true, generalizedContent: true } })
    : [];
  // A manual idea's note backs the draft the way an experience item does (see getDraftAuthorContext).
  const note = idea ? manualIdeaNote(idea) : null;
  return {
    idea,
    trustBasis: note ? ["USER_NOTE"] : idea?.trustBasis ?? [],
    memory: note ? [...memory, { content: note, disclosure: "PUBLIC", generalizedContent: null }] : memory,
    approvedProofs: proofRows.map((r) => parseBrandProof(r.instruction)).filter((p): p is NonNullable<typeof p> => p !== null),
    unsourcedProof: profile?.allowedProofClaims ?? [],
    allowCustomerResult: profile?.allowCustomerResultClaims ?? false,
    positioning: profile?.positioning ?? "",
  };
}
