import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseBrandProof, PROOF_DIRECTIVE_PREFIX, serializeBrandProof } from "@/lib/brand-proof";
import type { BrandVoiceQuestionnaire } from "@/types";
import type { JsonObject } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";

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

const MAX_SIGNATURE_PHRASES = 8;
const MAX_PHRASE_LENGTH = 80;
const MAX_EXAMPLES = 5;
const MIN_EXAMPLE_LENGTH = 20;
const MAX_EXAMPLE_LENGTH = 4000;
const MAX_PROOFS = 10;

function cleanQuestionnaire(value: unknown): BrandVoiceQuestionnaire | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const choiceKeys = Object.keys(CHOICES) as (keyof typeof CHOICES)[];
  if (choiceKeys.some((key) => !CHOICES[key].has(String(input[key])))) return null;

  const signaturePhrases = Array.isArray(input.signature_phrases)
    ? input.signature_phrases.map((phrase) => String(phrase).trim()).filter(Boolean).slice(0, MAX_SIGNATURE_PHRASES)
    : [];
  if (signaturePhrases.some((phrase) => phrase.length > MAX_PHRASE_LENGTH)) return null;

  return {
    formality: String(input.formality) as BrandVoiceQuestionnaire["formality"],
    sentence_length: String(input.sentence_length) as BrandVoiceQuestionnaire["sentence_length"],
    humor: String(input.humor) as BrandVoiceQuestionnaire["humor"],
    emoji_use: String(input.emoji_use) as BrandVoiceQuestionnaire["emoji_use"],
    signature_phrases: signaturePhrases,
  };
}

function cleanProof(item: unknown) {
  const raw = (item ?? {}) as Record<string, unknown>;
  const claim = String(raw.claim ?? "").trim();
  const sourceUrl = String(raw.source_url ?? "").trim();
  const sourceTitle = String(raw.source_title ?? "").trim();
  const notes = String(raw.notes ?? "").trim();

  if (claim.length < 10 || claim.length > 500) throw badRequest("Each proof claim must be 10–500 characters");
  if (sourceTitle.length > 160 || notes.length > 500) throw badRequest("A proof title or note is too long");

  const parsedUrl = URL.canParse(sourceUrl) ? new URL(sourceUrl) : null;
  if (!parsedUrl) throw badRequest("Every proof needs a valid source URL");
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw badRequest("Proof source URLs must use http or https");
  return { claim, sourceUrl: parsedUrl.toString(), sourceTitle, notes };
}

export async function getVoiceAndProof(clientId: string) {
  const [profile, examples, proofRows] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { clientId }, select: { toneQuestionnaire: true } }),
    prisma.toneExample.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } }),
    prisma.brandDirective.findMany({ where: { clientId, category: "PROOF", isActive: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return {
    questionnaire: cleanQuestionnaire(profile?.toneQuestionnaire) ?? DEFAULT_QUESTIONNAIRE,
    examples: examples.map((row) => ({ id: row.id, content: row.content, source: row.source })),
    proofs: proofRows.flatMap((row) => {
      const proof = parseBrandProof(row.instruction);
      return proof ? [{ id: row.id, claim: proof.claim, source_url: proof.sourceUrl, source_title: proof.sourceTitle ?? "", notes: proof.notes ?? "" }] : [];
    }),
  };
}

export async function saveVoiceAndProof(clientId: string, body: JsonObject) {
  const questionnaire = cleanQuestionnaire(body.questionnaire);
  if (!questionnaire) throw badRequest("Voice settings are incomplete or invalid");

  const examples = Array.isArray(body.examples) ? body.examples.map((item) => String(item).trim()).filter(Boolean) : [];
  if (examples.length > MAX_EXAMPLES) throw badRequest(`Provide up to ${MAX_EXAMPLES} writing samples`);
  if (examples.some((item) => item.length < MIN_EXAMPLE_LENGTH || item.length > MAX_EXAMPLE_LENGTH)) {
    throw badRequest("Each writing sample must be between 20 and 4,000 characters");
  }

  const rawProofs = Array.isArray(body.proofs) ? body.proofs : [];
  if (rawProofs.length > MAX_PROOFS) throw badRequest(`Provide up to ${MAX_PROOFS} proof sources`);
  const proofs = rawProofs.map(cleanProof);

  await prisma.$transaction(async (tx) => {
    await tx.brandProfile.update({ where: { clientId }, data: { toneQuestionnaire: questionnaire as unknown as Prisma.InputJsonValue } });
    await tx.toneExample.deleteMany({ where: { clientId } });
    if (examples.length) {
      await tx.toneExample.createMany({ data: examples.map((content) => ({ clientId, content, source: "brand_studio" })) });
    }
    await tx.brandDirective.deleteMany({ where: { clientId, category: "PROOF" } });
    if (proofs.length) {
      await tx.brandDirective.createMany({
        data: proofs.map((proof, index) => ({
          id: `DIR-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
          clientId,
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

  return { success: true, examples_saved: examples.length, proofs_saved: proofs.length };
}
