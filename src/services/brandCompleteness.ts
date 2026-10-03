import { prisma } from "@/lib/prisma";
import { computeCompleteness } from "@/lib/brandCompleteness";
import { parseBrandProof } from "@/lib/brand-proof";
import type { MemoryKind } from "@/constants/contentLanes";

const MIN_POSITIONING_LENGTH = 10;

export async function getBrandCompleteness(clientId: string) {
  const [icp, memory, profile, toneExamples, proofRows] = await Promise.all([
    prisma.icpProfile.findUnique({ where: { clientId }, select: { who: true, pains: true, decisions: true, questions: true } }),
    prisma.professionalMemory.findMany({ where: { clientId, isActive: true }, select: { kind: true } }),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { positioning: true } }),
    prisma.toneExample.count({ where: { clientId } }),
    prisma.brandDirective.findMany({ where: { clientId, isActive: true, category: "PROOF" }, select: { instruction: true } }),
  ]);
  return computeCompleteness({
    icp: icp ?? { who: "", pains: [], decisions: [], questions: [] },
    memoryKinds: memory.map((item) => item.kind as MemoryKind),
    hasPositioning: (profile?.positioning ?? "").trim().length > MIN_POSITIONING_LENGTH,
    toneExamples,
    approvedProofs: proofRows.filter((row) => parseBrandProof(row.instruction)).length,
  });
}
