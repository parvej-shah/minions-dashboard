import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { checkMemory } from "@/lib/ai/memoryCheck";
import { generalizedText } from "@/lib/drafts/generalize";
import { buildDraftAuthorContext, emptyDraftContext, type DraftAuthorContext, type DraftMemory } from "@/lib/drafts/authorContext";
import { writerExpertisePromptGuidance } from "@/constants/writerExpertise";
import { toIcpContext, EMPTY_ICP } from "@/services/authorContext";
import { parseBrandProof } from "@/lib/brand-proof";

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

export async function getDraftAuthorContext(clientId: string, ideaId: string): Promise<DraftAuthorContext> {
  const [idea, icpRow, profile] = await Promise.all([
    prisma.idea.findFirst({ where: { id: ideaId, clientId }, include: { lane: true } }),
    prisma.icpProfile.findUnique({ where: { clientId } }),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { writerExpertise: true } }),
  ]);
  const icp = icpRow ? toIcpContext(icpRow) : EMPTY_ICP;
  const standing = writerExpertisePromptGuidance(profile?.writerExpertise);
  if (!idea || !idea.gateVerdict) return emptyDraftContext(icp, standing, idea?.pillar);

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
  return buildDraftAuthorContext(idea, memory, icp, lane, standing);
}

/** What the draft check needs beyond the author context: the verified proof and the original memory. */
export async function getDraftCheckInputs(clientId: string, ideaId: string) {
  const [idea, profile, proofRows] = await Promise.all([
    prisma.idea.findFirst({ where: { id: ideaId, clientId }, select: { memoryIds: true, rawIdea: true, angle: true, why: true, icpProblem: true, authorAdvantage: true, signals: true } }),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { allowedProofClaims: true, allowCustomerResultClaims: true, positioning: true } }),
    prisma.brandDirective.findMany({ where: { clientId, isActive: true, category: "PROOF" }, select: { instruction: true } }),
  ]);
  const memory = idea?.memoryIds.length
    ? await prisma.professionalMemory.findMany({ where: { clientId, id: { in: idea.memoryIds } }, select: { content: true, disclosure: true, generalizedContent: true } })
    : [];
  return {
    idea,
    memory,
    approvedProofs: proofRows.map((r) => parseBrandProof(r.instruction)).filter((p): p is NonNullable<typeof p> => p !== null),
    unsourcedProof: profile?.allowedProofClaims ?? [],
    allowCustomerResult: profile?.allowCustomerResultClaims ?? false,
    positioning: profile?.positioning ?? "",
  };
}
