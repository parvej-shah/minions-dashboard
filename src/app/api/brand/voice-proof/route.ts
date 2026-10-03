import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { parseBrandProof, PROOF_DIRECTIVE_PREFIX, serializeBrandProof } from "@/lib/brand-proof";
import type { BrandVoiceQuestionnaire } from "@/types";

const DEFAULT_QUESTIONNAIRE: BrandVoiceQuestionnaire = {
  formality: "balanced",
  sentence_length: "mixed",
  humor: "light",
  emoji_use: "sometimes",
  signature_phrases: [],
};

const CHOICES = {
  formality: new Set(["casual", "balanced", "formal"]),
  sentence_length: new Set(["short", "mixed", "long"]),
  humor: new Set(["none", "light", "frequent"]),
  emoji_use: new Set(["never", "sometimes", "often"]),
};

function cleanQuestionnaire(value: unknown): BrandVoiceQuestionnaire | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    !CHOICES.formality.has(String(input.formality)) ||
    !CHOICES.sentence_length.has(String(input.sentence_length)) ||
    !CHOICES.humor.has(String(input.humor)) ||
    !CHOICES.emoji_use.has(String(input.emoji_use))
  ) return null;

  const signaturePhrases = Array.isArray(input.signature_phrases)
    ? input.signature_phrases.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    : [];
  if (signaturePhrases.some((item) => item.length > 80)) return null;

  return {
    formality: String(input.formality) as BrandVoiceQuestionnaire["formality"],
    sentence_length: String(input.sentence_length) as BrandVoiceQuestionnaire["sentence_length"],
    humor: String(input.humor) as BrandVoiceQuestionnaire["humor"],
    emoji_use: String(input.emoji_use) as BrandVoiceQuestionnaire["emoji_use"],
    signature_phrases: signaturePhrases,
  };
}

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const [profile, examples, proofRows] = await Promise.all([
      prisma.brandProfile.findUnique({ where: { clientId: ctx.clientId }, select: { toneQuestionnaire: true } }),
      prisma.toneExample.findMany({ where: { clientId: ctx.clientId }, orderBy: { createdAt: "asc" } }),
      prisma.brandDirective.findMany({
        where: { clientId: ctx.clientId, category: "PROOF", isActive: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const questionnaire = cleanQuestionnaire(profile?.toneQuestionnaire) ?? DEFAULT_QUESTIONNAIRE;
    const proofs = proofRows.flatMap((row) => {
      const proof = parseBrandProof(row.instruction);
      return proof ? [{
        id: row.id,
        claim: proof.claim,
        source_url: proof.sourceUrl,
        source_title: proof.sourceTitle ?? "",
        notes: proof.notes ?? "",
      }] : [];
    });

    return NextResponse.json({
      questionnaire,
      examples: examples.map((row) => ({ id: row.id, content: row.content, source: row.source })),
      proofs,
    });
  } catch (error) {
    return apiError(error, "Failed to load voice and proof settings");
  }
}

export async function PUT(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const questionnaire = cleanQuestionnaire(body.questionnaire);
    if (!questionnaire) return apiFailure("Voice settings are incomplete or invalid", 400);

    const examples = Array.isArray(body.examples)
      ? body.examples.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];
    if (examples.length > 5) return apiFailure("Provide up to 5 writing samples", 400);
    if (examples.some((item: string) => item.length < 20 || item.length > 4000)) {
      return apiFailure("Each writing sample must be between 20 and 4,000 characters", 400);
    }

    const rawProofs = Array.isArray(body.proofs) ? body.proofs : [];
    if (rawProofs.length > 10) return apiFailure("Provide up to 10 proof sources", 400);
    const proofs: Array<{ claim: string; sourceUrl: string; sourceTitle: string; notes: string }> = [];
    for (const item of rawProofs) {
      const claim = String(item?.claim ?? "").trim();
      const sourceUrl = String(item?.source_url ?? "").trim();
      const sourceTitle = String(item?.source_title ?? "").trim();
      const notes = String(item?.notes ?? "").trim();
      if (claim.length < 10 || claim.length > 500) return apiFailure("Each proof claim must be 10–500 characters", 400);
      if (sourceTitle.length > 160 || notes.length > 500) return apiFailure("A proof title or note is too long", 400);
      let parsedUrl: URL;
      try { parsedUrl = new URL(sourceUrl); } catch { return apiFailure("Every proof needs a valid source URL", 400); }
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return apiFailure("Proof source URLs must use http or https", 400);
      }
      proofs.push({ claim, sourceUrl: parsedUrl.toString(), sourceTitle, notes });
    }

    await prisma.$transaction(async (tx) => {
      await tx.brandProfile.update({
        where: { clientId: ctx.clientId },
        data: { toneQuestionnaire: questionnaire as unknown as Prisma.InputJsonValue },
      });
      await tx.toneExample.deleteMany({ where: { clientId: ctx.clientId } });
      if (examples.length) {
        await tx.toneExample.createMany({
          data: examples.map((content: string) => ({ clientId: ctx.clientId, content, source: "brand_studio" })),
        });
      }
      await tx.brandDirective.deleteMany({ where: { clientId: ctx.clientId, category: "PROOF" } });
      if (proofs.length) {
        await tx.brandDirective.createMany({
          data: proofs.map((proof, index) => ({
            id: `DIR-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
            clientId: ctx.clientId,
            category: "PROOF",
            ruleKey: `${PROOF_DIRECTIVE_PREFIX}${index + 1}`,
            instruction: serializeBrandProof(proof),
            priority: 1,
            audienceScope: "ALL",
            isActive: true,
          })),
        });
      }
    });

    return NextResponse.json({ success: true, examples_saved: examples.length, proofs_saved: proofs.length });
  } catch (error) {
    return apiError(error, "Failed to save voice and proof settings");
  }
}
