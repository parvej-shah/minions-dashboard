import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { DEFAULT_PALETTE } from "@/constants/brand";
import { PRIMARY_LOGO_URL } from "@/constants/config";
import { resolveAudienceScope, RETIRED_SCOPE_MESSAGE } from "@/constants/audience";
import { assertNotEstablished } from "@/services/onboardingGuard";
import type { JsonObject } from "@/server/http/body";
import { badRequest, notFound } from "@/server/http/errors";

const PER_CATEGORY_LIMIT = 6;
const FORBIDDEN_CATEGORY = "FORBIDDEN";

export const newDirectiveId = () => `DIR-${randomUUID()}`;
const toRuleKey = (key: unknown) => String(key).toLowerCase().replace(/\s+/g, "_");

export async function listDirectives(clientId: string) {
  const rows = await prisma.brandDirective.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } });
  return rows.map(toDirectiveDTO);
}

export async function createDirective(clientId: string, body: JsonObject) {
  if (body.from_onboarding === true) await assertNotEstablished(clientId);
  if (!body.category || !body.key || !body.content) throw badRequest("category, key, and content are required");
  const audienceScope = resolveAudienceScope(body.audience_scope);
  if (!audienceScope) throw badRequest(RETIRED_SCOPE_MESSAGE);

  const category = body.category as string;
  if (category !== FORBIDDEN_CATEGORY) {
    const active = await prisma.brandDirective.count({ where: { clientId, category, isActive: true } });
    if (active >= PER_CATEGORY_LIMIT) {
      throw badRequest(
        `You have reached the limit of ${PER_CATEGORY_LIMIT} active directives for "${category}". Please edit or remove existing directives in this category.`
      );
    }
  }

  const created = await prisma.brandDirective.create({
    data: {
      id: newDirectiveId(),
      clientId,
      category,
      ruleKey: toRuleKey(body.key),
      instruction: String(body.content).trim(),
      priority: (body.priority as number) || 1,
      audienceScope,
      isActive: true,
    },
  });
  return toDirectiveDTO(created);
}

async function requireOwnedDirective(clientId: string, id: string) {
  const owned = await prisma.brandDirective.findFirst({ where: { id, clientId }, select: { id: true } });
  if (!owned) throw notFound("Brand directive not found");
}

export async function updateDirective(clientId: string, id: string, body: JsonObject) {
  const audienceScope = body.audience_scope !== undefined ? resolveAudienceScope(body.audience_scope) : null;
  if (body.audience_scope !== undefined && !audienceScope) throw badRequest(RETIRED_SCOPE_MESSAGE);
  await requireOwnedDirective(clientId, id);

  const updated = await prisma.brandDirective.update({
    where: { id },
    data: {
      ...(body.is_active !== undefined && { isActive: body.is_active as boolean }),
      ...(body.category !== undefined && { category: body.category as string }),
      ...(body.key !== undefined && { ruleKey: toRuleKey(body.key) }),
      ...(body.content !== undefined && { instruction: body.content as string }),
      ...(body.priority !== undefined && { priority: Number(body.priority) }),
      ...(audienceScope && { audienceScope }),
    },
  });
  return toDirectiveDTO(updated);
}

export async function deleteDirective(clientId: string, id: string) {
  await requireOwnedDirective(clientId, id);
  await prisma.brandDirective.delete({ where: { id } });
}

export async function applyPreset(clientId: string, presetId: unknown) {
  const preset = BRAND_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) throw badRequest("Invalid preset ID");

  const tone = { toneFormality: preset.toneFormality, toneCadence: preset.toneCadence };
  await prisma.brandProfile.upsert({
    where: { clientId },
    update: { positioning: preset.icpDescription, allowedProofClaims: preset.proofPoints, ...tone },
    create: {
      clientId,
      brandName: preset.industry,
      companyDomain: "",
      positioning: preset.icpDescription,
      primaryLogoUrl: PRIMARY_LOGO_URL,
      ...DEFAULT_PALETTE,
      allowedProofClaims: preset.proofPoints,
      ...tone,
    },
  });

  const directive = (category: string, ruleKey: string, instruction: string, priority: number, audienceScope = "ALL") => ({
    id: newDirectiveId(),
    clientId,
    category,
    ruleKey,
    instruction,
    priority,
    audienceScope,
    isActive: true,
  });

  await prisma.brandDirective.createMany({
    data: [
      directive("VOICE", "core_philosophy", preset.corePhilosophy, 1),
      directive("TOPICS", "core_themes", preset.coreThemes, 2),
      ...(preset.audienceLanes?.builders ? [directive("AUDIENCE", "lane_builders", preset.audienceLanes.builders, 3, "ICP")] : []),
      ...(preset.forbiddenWords?.length
        ? [directive(FORBIDDEN_CATEGORY, "banned_buzzwords", `Never use these words or phrases: ${preset.forbiddenWords.join(", ")}.`, 1)]
        : []),
    ],
  });

  return { success: true, directives: await listDirectives(clientId) };
}
