import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireTenantAccess } from "@/lib/tenant";
import { DISTRIBUTION_CHANNELS } from "@/constants/channels";
import { BRAND_PRESETS } from "@/constants/brandPresets";

/**
 * ICP/industry/tone-formality/channel step of onboarding. Writes:
 * - BrandProfile.positioning (upserted, the one-line "who we serve" pitch
 *   the pipeline's prompts read via /api/brand/context)
 * - BrandDirective rows: AUDIENCE, POSITIONING, VOICE, TOPICS, etc.
 * - ClientChannel rows, one per selected platform (blog/facebook/linkedin/x)
 */
export async function POST(request: Request) {
  const ctx = await requireTenantAccess(true);
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const industry = (body.industry || "").toString().trim();
    const icpDescription = (body.icp_description || "").toString().trim();
    const presetId = (body.preset_id || "").toString().trim();
    const logoUrl = (body.logo_url || "").toString().trim();
    const channels: string[] = Array.isArray(body.channels) ? body.channels : [];
    // When the Brand Interview already produced real, grounded directives
    // (Step 3), don't also lay down this preset's generic template content --
    // the two used to coexist and directly contradict each other (e.g. a
    // preset's stock "core_themes" sitting next to an AI directive naming
    // the actual product). The preset's tone/voice fields on BrandProfile
    // below are harmless defaults either way, so only the directive rows are gated.
    const hasAiDirectives = body.hasAiDirectives === true;

    if (!industry || !icpDescription) {
      return apiFailure("industry and icp_description are required", 400);
    }
    const validChannels = channels.filter((c) => ["blog", "facebook", "linkedin", "x"].includes(c));

    const matchedPreset = BRAND_PRESETS.find((p) => p.id === presetId);

    const client = await prisma.client.findUnique({
      where: { id: ctx.clientId },
      select: { name: true },
    });

    await prisma.brandProfile.upsert({
      where: { clientId: ctx.clientId },
      update: {
        positioning: icpDescription,
        toneCadence: matchedPreset?.toneCadence ?? "1-3 sentence paragraphs, plain language, no filler.",
        toneFormality: matchedPreset?.toneFormality ?? "conversational_peer",
        allowedProofClaims: matchedPreset?.proofPoints ?? [],
        // Only set on a fresh LinkedIn import -- never clobber a logo the user already set.
        ...(logoUrl ? { primaryLogoUrl: logoUrl } : {}),
      },
      create: {
        clientId: ctx.clientId,
        brandName: client?.name || industry,
        companyDomain: "",
        positioning: icpDescription,
        primaryLogoUrl: logoUrl,
        primaryInk: "#12242A",
        brandTeal: "#0E5C63",
        brandCoral: "#FF6B4A",
        brandCream: "#FFF8F0",
        accentBlue: "#3A6EA5",
        toneFormality: matchedPreset?.toneFormality ?? "conversational_peer",
        toneCadence: matchedPreset?.toneCadence ?? "1-3 sentence paragraphs, plain language, no filler.",
        allowedProofClaims: matchedPreset?.proofPoints ?? [],
      },
    });

    // Clean up previous setup-generated directives to avoid duplicates on re-submission
    await prisma.brandDirective.deleteMany({
      where: {
        clientId: ctx.clientId,
        ruleKey: {
          in: [
            "icp_description",
            "company_name",
            "core_philosophy",
            "core_themes",
            "lane_builders",
            "lane_business",
            "banned_buzzwords",
          ],
        },
      },
    });

    const directivesToCreate = [
      {
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "AUDIENCE",
        ruleKey: "icp_description",
        instruction: `Industry: ${industry}. Target Audience: ${icpDescription}`,
        priority: 1,
        audienceScope: "ALL",
        isActive: true,
      },
    ];

    if (client?.name) {
      directivesToCreate.push({
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "POSITIONING",
        ruleKey: "company_name",
        instruction: client.name,
        priority: 1,
        audienceScope: "ALL",
        isActive: true,
      });
    }

    if (matchedPreset && !hasAiDirectives) {
      directivesToCreate.push({
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "VOICE",
        ruleKey: "core_philosophy",
        instruction: matchedPreset.corePhilosophy,
        priority: 1,
        audienceScope: "ALL",
        isActive: true,
      });

      directivesToCreate.push({
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "TOPICS",
        ruleKey: "core_themes",
        instruction: matchedPreset.coreThemes,
        priority: 2,
        audienceScope: "ALL",
        isActive: true,
      });

      if (matchedPreset.audienceLanes?.builders) {
        directivesToCreate.push({
          id: `DIR-${crypto.randomUUID()}`,
          clientId: ctx.clientId,
          category: "AUDIENCE",
          ruleKey: "lane_builders",
          instruction: matchedPreset.audienceLanes.builders,
          priority: 3,
          audienceScope: "ICP",
          isActive: true,
        });
      }

      if (matchedPreset.audienceLanes?.business) {
        directivesToCreate.push({
          id: `DIR-${crypto.randomUUID()}`,
          clientId: ctx.clientId,
          category: "AUDIENCE",
          ruleKey: "lane_business",
          instruction: matchedPreset.audienceLanes.business,
          priority: 3,
          audienceScope: "PEER",
          isActive: true,
        });
      }

      if (matchedPreset.forbiddenWords?.length) {
        directivesToCreate.push({
          id: `DIR-${crypto.randomUUID()}`,
          clientId: ctx.clientId,
          category: "FORBIDDEN",
          ruleKey: "banned_buzzwords",
          instruction: `Never use these words or phrases: ${matchedPreset.forbiddenWords.join(", ")}.`,
          priority: 1,
          audienceScope: "ALL",
          isActive: true,
        });
      }
    }

    await prisma.brandDirective.createMany({
      data: directivesToCreate,
    });

    // Every catalogue channel gets a row here, not just the ones the tenant
    // picked -- otherwise GET /api/channels' own seeding step would later
    // fill in the unpicked ones using each channel's global defaultActive
    // flag (facebook defaults to true), silently activating a channel this
    // tenant never chose.
    await Promise.all(
      DISTRIBUTION_CHANNELS.map((def) =>
        prisma.clientChannel.upsert({
          where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: def.key } },
          update: { isActive: validChannels.includes(def.key) },
          create: { clientId: ctx.clientId, channelKey: def.key, isActive: validChannels.includes(def.key) },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to save onboarding setup");
  }
}
