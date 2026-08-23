import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { DISTRIBUTION_CHANNELS } from "@/constants/channels";

/**
 * ICP/industry/tone-formality/channel step of onboarding. Writes:
 * - BrandProfile.positioning (upserted, the one-line "who we serve" pitch
 *   the pipeline's prompts read via /api/brand/context)
 * - BrandDirective rows, category ICP_PROFILE — reusing the same
 *   priority-tiered directive pattern 01_idea_harvester and
 *   02_idea_to_asset already read, instead of a parallel config table
 * - ClientChannel rows, one per selected platform (blog/facebook/linkedin/x)
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const industry = (body.industry || "").toString().trim();
    const icpDescription = (body.icp_description || "").toString().trim();
    const channels: string[] = Array.isArray(body.channels) ? body.channels : [];

    if (!industry || !icpDescription) {
      return apiFailure("industry and icp_description are required", 400);
    }
    const validChannels = channels.filter((c) => ["blog", "facebook", "linkedin", "x"].includes(c));

    const client = await prisma.client.findUnique({
      where: { id: ctx.clientId },
      select: { name: true },
    });

    await prisma.brandProfile.upsert({
      where: { clientId: ctx.clientId },
      update: { positioning: icpDescription },
      create: {
        clientId: ctx.clientId,
        brandName: industry,
        companyDomain: "",
        positioning: icpDescription,
        primaryLogoUrl: "",
        primaryInk: "#12242A",
        brandTeal: "#0E5C63",
        brandCoral: "#FF6B4A",
        brandCream: "#FFF8F0",
        accentBlue: "#3A6EA5",
        toneFormality: "conversational_peer",
        toneCadence: "1-3 sentence paragraphs, plain language, no filler.",
      },
    });

    // Random ids, not a sequential count -- a global brand_directives count
    // race-conditions across concurrent onboardings (two tenants signing up
    // at once could compute the same next id and collide on the primary key).
    // This route can be called more than once per tenant (the onboarding
    // wizard's Back button makes re-submitting this step a normal path), so
    // each rule is cleared by (clientId, ruleKey) before recreating it --
    // otherwise every resubmit would pile up another duplicate directive
    // feeding the AI prompts.
    await prisma.brandDirective.deleteMany({
      where: { clientId: ctx.clientId, ruleKey: "icp_description" },
    });
    await prisma.brandDirective.create({
      data: {
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "ICP_PROFILE",
        ruleKey: "icp_description",
        instruction: `Industry: ${industry}. ${icpDescription}`,
        priority: 1,
        audienceScope: "ALL",
        isActive: true,
      },
    });

    if (client?.name) {
      await prisma.brandDirective.deleteMany({
        where: { clientId: ctx.clientId, ruleKey: "company_name" },
      });
      await prisma.brandDirective.create({
        data: {
          id: `DIR-${crypto.randomUUID()}`,
          clientId: ctx.clientId,
          category: "IDENTITY",
          ruleKey: "company_name",
          instruction: client.name,
          priority: 1,
          audienceScope: "ALL",
          isActive: true,
        },
      });
    }

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
