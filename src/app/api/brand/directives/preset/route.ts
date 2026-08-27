import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { BRAND_PRESETS } from "@/constants/brandPresets";

export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const presetId = body.presetId;
    const preset = BRAND_PRESETS.find((p) => p.id === presetId);

    if (!preset) {
      return apiFailure("Invalid preset ID", 400);
    }

    await prisma.brandProfile.upsert({
      where: { clientId: ctx.clientId },
      update: {
        positioning: preset.icpDescription,
        toneCadence: preset.toneCadence,
        toneFormality: preset.toneFormality,
        allowedProofClaims: preset.proofPoints,
      },
      create: {
        clientId: ctx.clientId,
        brandName: preset.industry,
        companyDomain: "",
        positioning: preset.icpDescription,
        primaryLogoUrl: "",
        primaryInk: "#12242A",
        brandTeal: "#0E5C63",
        brandCoral: "#FF6B4A",
        brandCream: "#FFF8F0",
        accentBlue: "#3A6EA5",
        toneFormality: preset.toneFormality,
        toneCadence: preset.toneCadence,
        allowedProofClaims: preset.proofPoints,
      },
    });

    const directivesToCreate = [
      {
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "EDITORIAL_PHILOSOPHY",
        ruleKey: "core_philosophy",
        instruction: preset.corePhilosophy,
        priority: 1,
        audienceScope: "ALL",
        isActive: true,
      },
      {
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "CONTENT_THEMES",
        ruleKey: "core_themes",
        instruction: preset.coreThemes,
        priority: 2,
        audienceScope: "ALL",
        isActive: true,
      },
    ];

    if (preset.audienceLanes?.builders) {
      directivesToCreate.push({
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "AUDIENCE_LANES",
        ruleKey: "lane_builders",
        instruction: preset.audienceLanes.builders,
        priority: 3,
        audienceScope: "ICP",
        isActive: true,
      });
    }

    if (preset.audienceLanes?.business) {
      directivesToCreate.push({
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "AUDIENCE_LANES",
        ruleKey: "lane_business",
        instruction: preset.audienceLanes.business,
        priority: 3,
        audienceScope: "PEER",
        isActive: true,
      });
    }

    if (preset.forbiddenWords?.length) {
      directivesToCreate.push({
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "FORBIDDEN",
        ruleKey: "banned_buzzwords",
        instruction: `Never use these words or phrases: ${preset.forbiddenWords.join(", ")}.`,
        priority: 1,
        audienceScope: "ALL",
        isActive: true,
      });
    }

    await prisma.brandDirective.createMany({
      data: directivesToCreate,
    });

    const allDirectives = await prisma.brandDirective.findMany({
      where: { clientId: ctx.clientId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      directives: allDirectives.map(toDirectiveDTO),
    });
  } catch (error) {
    return apiError(error, "Failed to apply starter pack preset");
  }
}
