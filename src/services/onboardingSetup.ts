import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isPlaceholderTenantName } from "@/lib/tenant";
import { syncIcpDirective } from "@/lib/icpDirective";
import { DISTRIBUTION_CHANNELS } from "@/constants/channels";
import { BRAND_PRESETS, type BrandPreset } from "@/constants/brandPresets";
import { DEFAULT_PALETTE } from "@/constants/brand";
import { resolveWriterExpertise } from "@/constants/writerExpertise";
import { normalizeDomain } from "@/constants/config";
import { newDirectiveId } from "@/services/brandDirectives";
import { assertNotEstablished } from "@/services/onboardingGuard";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";

const EMPTY_ICP = { who: "", role: "", company_type: "", pains: [], decisions: [], questions: [], buying_triggers: [], vocabulary: [] };
const DEFAULT_TONE_CADENCE = "1-3 sentence paragraphs, plain language, no filler.";
const DEFAULT_TONE_FORMALITY = "conversational_peer";
const SETUP_DIRECTIVE_KEYS = [
  "icp_description",
  "company_name",
  "core_philosophy",
  "core_themes",
  "lane_builders",
  "lane_business",
  "banned_buzzwords",
  "content_focus",
];

function googlePhotoUrl(image: string | null | undefined): string {
  const url = image?.trim() ?? "";
  return /^https:\/\//.test(url) ? url.replace(/=s\d+(-c)?$/, "=s400-c") : "";
}

async function resolveIdentity(clientId: string, body: JsonObject, industry: string) {
  const session = await auth();
  const googleName = session?.user?.name?.trim() || "";
  const googlePhoto = googlePhotoUrl(session?.user?.image);
  const importedLogo = asString(body.logo_url);

  const [client, existingProfile] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { primaryLogoUrl: true } }),
  ]);

  // The workspace is created with a placeholder name before setup asks for anything. The Google name only replaces that placeholder, never a name someone chose.
  const isPlaceholder = isPlaceholderTenantName(client?.name);
  const businessName = asString(body.business_name) || (isPlaceholder ? googleName : "");
  if (businessName && businessName !== client?.name && isPlaceholder) {
    await prisma.client.update({ where: { id: clientId }, data: { name: businessName } });
  }

  return {
    businessName,
    brandNameOnCreate: businessName || client?.name || industry,
    importedLogo,
    logoOnCreate: importedLogo || googlePhoto,
    // The Google photo only fills an empty logo; a LinkedIn import always wins.
    logoOnUpdate: importedLogo || (!existingProfile?.primaryLogoUrl && googlePhoto ? googlePhoto : ""),
  };
}

async function upsertBrandProfile(
  clientId: string,
  input: { icpDescription: string; websiteUrl: string; preset: BrandPreset | undefined; writerExpertise: ReturnType<typeof resolveWriterExpertise> },
  identity: Awaited<ReturnType<typeof resolveIdentity>>
) {
  const { icpDescription, websiteUrl, preset, writerExpertise } = input;
  const toneFormality = preset?.toneFormality ?? DEFAULT_TONE_FORMALITY;
  const toneCadence = preset?.toneCadence ?? DEFAULT_TONE_CADENCE;

  // allowedProofClaims stays empty: the writer treats it as VERIFIED, and a preset's illustrative metrics belong to no real tenant.
  await prisma.brandProfile.upsert({
    where: { clientId },
    update: {
      positioning: icpDescription,
      ...(websiteUrl ? { companyDomain: websiteUrl } : {}),
      ...(identity.businessName ? { brandName: identity.businessName } : {}),
      ...(identity.logoOnUpdate ? { primaryLogoUrl: identity.logoOnUpdate } : {}),
      toneCadence,
      toneFormality,
      allowedProofClaims: [],
      writerExpertise,
    },
    create: {
      clientId,
      brandName: identity.brandNameOnCreate,
      companyDomain: websiteUrl,
      positioning: icpDescription,
      primaryLogoUrl: identity.logoOnCreate,
      ...DEFAULT_PALETTE,
      toneFormality,
      toneCadence,
      allowedProofClaims: [],
      writerExpertise,
    },
  });
}

// The preset's stock AUDIENCE lanes are never written: they would override the audience the user just typed.
// Tone, themes, philosophy and forbidden words describe the brand's register, so they compose with the user's answer.
function setupDirectives(clientId: string, contentFocus: string, preset: BrandPreset | undefined, hasAiDirectives: boolean) {
  const directive = (category: string, ruleKey: string, instruction: string, priority: number) => ({
    id: newDirectiveId(),
    clientId,
    category,
    ruleKey,
    instruction,
    priority,
    audienceScope: "ALL",
    isActive: true,
  });

  const presetDirectives =
    preset && !hasAiDirectives
      ? [
          directive("VOICE", "core_philosophy", preset.corePhilosophy, 1),
          directive("TOPICS", "core_themes", preset.coreThemes, 2),
          ...(preset.forbiddenWords?.length
            ? [directive("FORBIDDEN", "banned_buzzwords", `Never use these words or phrases: ${preset.forbiddenWords.join(", ")}.`, 1)]
            : []),
        ]
      : [];

  return [...(contentFocus ? [directive("TOPICS", "content_focus", contentFocus, 1)] : []), ...presetDirectives];
}

// Every catalogue channel gets a row, or channel seeding would later activate unpicked channels from their global defaults.
function activateChannels(clientId: string, picked: string[]) {
  return Promise.all(
    DISTRIBUTION_CHANNELS.map((def) =>
      prisma.clientChannel.upsert({
        where: { clientId_channelKey: { clientId, channelKey: def.key } },
        update: { isActive: picked.includes(def.key) },
        create: { clientId, channelKey: def.key, isActive: picked.includes(def.key) },
      })
    )
  );
}

export async function saveOnboardingSetup(clientId: string, body: JsonObject) {
  await assertNotEstablished(clientId);

  const industry = asString(body.industry);
  const icpDescription = asString(body.icp_description);
  if (!industry || !icpDescription) throw badRequest("industry and icp_description are required");

  const preset = BRAND_PRESETS.find((candidate) => candidate.id === asString(body.preset_id));
  const identity = await resolveIdentity(clientId, body, industry);

  await upsertBrandProfile(
    clientId,
    {
      icpDescription,
      websiteUrl: normalizeDomain(asString(body.website_url)) || "",
      preset,
      writerExpertise: resolveWriterExpertise(body.writer_expertise),
    },
    identity
  );

  await prisma.brandDirective.deleteMany({ where: { clientId, ruleKey: { in: SETUP_DIRECTIVE_KEYS } } });

  // The audience answer becomes the ideal customer, which Brand shows and edits; its AUDIENCE directive is derived from it.
  await prisma.icpProfile.upsert({
    where: { clientId },
    create: { id: `ICP-${clientId}`, clientId, who: icpDescription },
    update: { who: icpDescription },
  });
  await syncIcpDirective(clientId, { ...EMPTY_ICP, who: icpDescription });

  await prisma.brandDirective.createMany({
    data: setupDirectives(clientId, asString(body.content_focus), preset, body.hasAiDirectives === true),
  });

  const channels = Array.isArray(body.channels) ? body.channels : [];
  await activateChannels(clientId, channels.filter((key) => DISTRIBUTION_CHANNELS.some((def) => def.key === key)));
  return { success: true };
}
