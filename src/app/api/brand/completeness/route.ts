import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { computeCompleteness } from "@/lib/brandCompleteness";
import { parseBrandProof } from "@/lib/brand-proof";
import type { MemoryKind } from "@/constants/contentLanes";

/** How complete the author profile is, and the next three things to add. */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const clientId = ctx.clientId;
    const [icp, memory, profile, toneExamples, proofRows] = await Promise.all([
      prisma.icpProfile.findUnique({ where: { clientId }, select: { who: true, pains: true, decisions: true, questions: true } }),
      prisma.professionalMemory.findMany({ where: { clientId, isActive: true }, select: { kind: true } }),
      prisma.brandProfile.findUnique({ where: { clientId }, select: { positioning: true } }),
      prisma.toneExample.count({ where: { clientId } }),
      prisma.brandDirective.findMany({ where: { clientId, isActive: true, category: "PROOF" }, select: { instruction: true } }),
    ]);
    return NextResponse.json(
      computeCompleteness({
        icp: icp ?? { who: "", pains: [], decisions: [], questions: [] },
        memoryKinds: memory.map((m) => m.kind as MemoryKind),
        hasPositioning: (profile?.positioning ?? "").trim().length > 10,
        toneExamples,
        approvedProofs: proofRows.filter((r) => parseBrandProof(r.instruction)).length,
      })
    );
  } catch (error) {
    return apiError(error, "Failed to check your brand profile");
  }
}
