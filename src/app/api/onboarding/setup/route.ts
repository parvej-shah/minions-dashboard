import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireTenantAccess, isPlaceholderTenantName } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { DISTRIBUTION_CHANNELS } from "@/constants/channels";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { resolveWriterExpertise } from "@/constants/writerExpertise";
import { normalizeDomain } from "@/constants/config";
import { refuseOnboardingOverwrite } from "@/lib/onboardingGuard";
import { syncIcpDirective } from "@/lib/icpDirective";

/**
 * ICP/industry/tone-formality/channel step of onboarding. Writes:
 * - BrandProfile.positioning (upserted, the one-line "who we serve" pitch
 *   the pipeline's prompts read via /api/brand/context)
 * - BrandDirective rows: AUDIENCE, POSITIONING, VOICE, TOPICS, etc.
 * - ClientChannel rows, one per selected platform (blog/facebook/linkedin/x)
 */
const EMPTY_ICP = { who: "", role: "", company_type: "", pains: [], decisions: [], questions: [], buying_triggers: [], vocabulary: [] };

export async function POST(request: Request) {
  const ctx = await requireTenantAccess(true);
  if ("error" in ctx) return ctx.error;

  // Onboarding rewrites the whole brand; never let it run over an established workspace.
  const refused = await refuseOnboardingOverwrite(ctx.clientId);
  if (refused) return refused;

  try {
    const body = await request.json();
    const industry = (body.industry || "").toString().trim();
    const icpDescription = (body.icp_description || "").toString().trim();
    const contentFocus = (body.content_focus || "").toString().trim();
    const presetId = (body.preset_id || "").toString().trim();
    // Setup no longer asks for a business name or photo, so the Google
    // account's name and picture stand in. Without them the cover's author
    // line showed "<email-local-part>'s Workspace" and an initials monogram.
    const session = await auth();
    const googleName = session?.user?.name?.trim() || "";
    const googlePhoto = googlePhotoUrl(session?.user?.image);
    const importedLogo = (body.logo_url || "").toString().trim();
    const logoUrl = importedLogo || googlePhoto;
    const typedName = (body.business_name || "").toString().trim();
    // The tenant's own public site. blogUrl() builds every public post URL on
    // this, so leaving it empty makes those URLs advertise getminions.ai.
    const websiteUrl = normalizeDomain((body.website_url || "").toString()) || "";
    // Falls back to OPERATOR for any unrecognized value, so an older client
    // that doesn't send the field still writes a valid level.
    const writerExpertise = resolveWriterExpertise(body.writer_expertise);
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

    const [client, existingProfile] = await Promise.all([
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { name: true } }),
      prisma.brandProfile.findUnique({ where: { clientId: ctx.clientId }, select: { primaryLogoUrl: true } }),
    ]);

    // getOrCreateTenant() names a fresh tenant "<email-local-part>'s
    // Workspace" because it runs before onboarding has asked for anything.
    // Onboarding is where the real name finally arrives, so promote it here --
    // otherwise the placeholder stuck permanently and surfaced everywhere
    // company_name is shown, including generated cover images.
    const isPlaceholderName = isPlaceholderTenantName(client?.name);
    // The Google name only replaces a placeholder, never a name someone chose.
    const businessName = typedName || (isPlaceholderName ? googleName : "");
    const resolvedName = businessName || client?.name || industry;

    if (businessName && businessName !== client?.name && isPlaceholderName) {
      await prisma.client.update({
        where: { id: ctx.clientId },
        data: { name: businessName },
      });
    }

    await prisma.brandProfile.upsert({
      where: { clientId: ctx.clientId },
      update: {
        positioning: icpDescription,
        // Never clobber a domain the operator already set with a blank.
        ...(websiteUrl ? { companyDomain: websiteUrl } : {}),
        // Also set on update: re-running onboarding with a real business name
        // must overwrite a placeholder brandName, which previously persisted
        // because brandName was only ever written in the create branch.
        ...(businessName ? { brandName: businessName } : {}),
        toneCadence: matchedPreset?.toneCadence ?? "1-3 sentence paragraphs, plain language, no filler.",
        toneFormality: matchedPreset?.toneFormality ?? "conversational_peer",
        // Deliberately NOT seeded from the preset. allowedProofClaims is the
        // list of claims the writer treats as VERIFIED and may cite, and the
        // preset's are invented illustrations ("Sub-2s response latency in
        // production", "100+ analyzed SaaS onboarding funnels") that belong to
        // no real tenant. Seeding them handed every new account a set of
        // fabricated metrics to publish. The tenant adds their own in
        // Brand > Voice; empty means the writer must ground claims in the
        // source material instead.
        allowedProofClaims: [],
        writerExpertise,
        // Only set on a fresh LinkedIn import -- never clobber a logo the user already set.
        // The Google photo only fills an empty one.
        ...(importedLogo ? { primaryLogoUrl: importedLogo } : !existingProfile?.primaryLogoUrl && googlePhoto ? { primaryLogoUrl: googlePhoto } : {}),
      },
      create: {
        clientId: ctx.clientId,
        brandName: resolvedName,
        companyDomain: websiteUrl,
        positioning: icpDescription,
        primaryLogoUrl: logoUrl,
        primaryInk: "#12242A",
        brandTeal: "#0E5C63",
        brandCoral: "#FF6B4A",
        brandCream: "#FFF8F0",
        accentBlue: "#3A6EA5",
        toneFormality: matchedPreset?.toneFormality ?? "conversational_peer",
        toneCadence: matchedPreset?.toneCadence ?? "1-3 sentence paragraphs, plain language, no filler.",
        allowedProofClaims: [],
        writerExpertise,
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
            "content_focus",
          ],
        },
      },
    });

    // The reader setup asked about becomes the ideal customer, which Brand
    // shows and edits, and its AUDIENCE directive is derived from it. Written
    // as a raw "Industry: ... Target Audience: ..." directive instead, Brand
    // showed that string as "Who they are".
    await prisma.icpProfile.upsert({
      where: { clientId: ctx.clientId },
      create: { id: `ICP-${ctx.clientId}`, clientId: ctx.clientId, who: icpDescription },
      update: { who: icpDescription },
    });
    await syncIcpDirective(ctx.clientId, { ...EMPTY_ICP, who: icpDescription });

    const directivesToCreate: {
      id: string;
      clientId: string;
      category: string;
      ruleKey: string;
      instruction: string;
      priority: number;
      audienceScope: string;
      isActive: boolean;
    }[] = [];

    if (contentFocus) {
      directivesToCreate.push({
        id: `DIR-${crypto.randomUUID()}`,
        clientId: ctx.clientId,
        category: "TOPICS",
        ruleKey: "content_focus",
        instruction: contentFocus,
        priority: 1,
        audienceScope: "ALL",
        isActive: true,
      });
    }

    // No company_name directive: the prompts take the name from brandName,
    // and the directive copy showed as a Positioning note that kept the
    // placeholder name after the brand was renamed.

    // The preset's stock AUDIENCE lanes are deliberately NOT written.
    //
    // They describe the preset's archetypal reader ("Lane A -- Builders:
    // software engineers, AI engineers, and technical founders"), which
    // silently overrode the audience the user typed one field earlier. A user
    // who picks the AI industry but writes "SMB owners who want AI explained
    // without jargon" got both statements injected into the same prompt, and
    // the model had no way to know which one was authoritative.
    //
    // icp_description (written above, priority 1, from the user's own words)
    // is now the single source of truth for who the reader is. Tone, themes,
    // philosophy and forbidden words still come from the preset -- those
    // describe the brand's register, not its audience, so they compose with
    // the user's answer instead of contradicting it.
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

/** The Google profile picture at cover size (Google serves 96px by default), or "". */
function googlePhotoUrl(image: string | null | undefined): string {
  const url = image?.trim() ?? "";
  if (!/^https:\/\//.test(url)) return "";
  return url.replace(/=s\d+(-c)?$/, "=s400-c");
}
