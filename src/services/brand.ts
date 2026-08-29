import { prisma } from "@/lib/prisma";
import { DEFAULT_BRAND_SETTINGS, STATIC_BANNED_LEXICON } from "@/constants/brand";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { toBrandSettingsDTO } from "@/lib/mappers/brandProfile";
import type { BrandProfileInput, BrandSettings } from "@/types";

/**
 * Brand settings plus the live directive set, scoped to one tenant.
 *
 * Company info, voice guidelines, and colors come from that tenant's
 * `brand_profile` row; if it has never been seeded, the hardcoded seed
 * constant fills in so the page still renders something editable instead of
 * erroring.
 */
export async function getBrandSettings(clientId: string): Promise<BrandSettings> {
  const [profile, directives, client] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { clientId } }).catch(() => null),
    prisma.brandDirective
      .findMany({
        where: { clientId, category: { not: "DISTRIBUTION" } },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
    prisma.client.findUnique({ where: { id: clientId } }).catch(() => null),
  ]);

  const clientName = client?.name || "My Brand";

  const forbiddenWords = directives
    .filter((d) => d.category === "FORBIDDEN")
    .map((d) => d.instruction.trim())
    .filter(Boolean);

  const dynamicBannedLexicon = Array.from(
    new Set([...forbiddenWords, ...STATIC_BANNED_LEXICON])
  );

  const settings = profile
    ? toBrandSettingsDTO(profile)
    : {
        id: `BRAND-${clientId}`,
        brand_name: clientName,
        company_domain: "",
        positioning: "",
        primary_logo_url: "",
        primary_ink: "#0B0F14",
        brand_teal: "#00D4AA",
        brand_coral: "#FF6B4A",
        brand_cream: "#F5F7FA",
        accent_blue: "#7C8CFF",
        tone_guidelines: {
          formality: "Technical & Direct",
          cadence: "Concise, structured paragraphs with clear technical reasoning.",
          banned_lexicon: dynamicBannedLexicon,
          allowed_proof_claims: [],
        },
        thumbnail_layout: {
          visual_style: "Executive Studio Lighting (Dark slate background, subtle rim lighting)",
          show_badge: true,
          show_logo: false,
          title_word_count_min: 3,
          title_word_count_max: 6,
        },
        updated_at: new Date().toISOString(),
      };

  settings.tone_guidelines.banned_lexicon = dynamicBannedLexicon;

  return {
    ...settings,
    directives: directives.map(toDirectiveDTO),
  };
}

export interface WriterVoiceConfig {
  toneQuestionnaire: unknown;
  toneExamples: string[];
  allowCustomerResultClaims: boolean;
}

/**
 * The fields the n8n Writer/claims-gate steps need that the Brand Studio DTO
 * doesn't carry: the structured tone questionnaire, raw few-shot example
 * posts, and the claims-gate's CUSTOMER_RESULT override.
 */
export async function getWriterVoiceConfig(clientId: string): Promise<WriterVoiceConfig> {
  const [profile, examples] = await Promise.all([
    prisma.brandProfile.findUnique({
      where: { clientId },
      select: { toneQuestionnaire: true, allowCustomerResultClaims: true },
    }),
    prisma.toneExample.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } }),
  ]);

  return {
    toneQuestionnaire: profile?.toneQuestionnaire ?? null,
    toneExamples: examples.map((e) => e.content),
    allowCustomerResultClaims: profile?.allowCustomerResultClaims ?? false,
  };
}

/** Upserts the tenant's `brand_profile` row from the Brand Profile tab. */
export async function updateBrandSettings(
  clientId: string,
  input: BrandProfileInput
): Promise<BrandSettings> {
  const data = {
    brandName: input.brand_name,
    companyDomain: input.company_domain,
    positioning: input.positioning,
    primaryLogoUrl: input.primary_logo_url,
    primaryInk: input.primary_ink,
    brandTeal: input.brand_teal,
    brandCoral: input.brand_coral,
    brandCream: input.brand_cream,
    accentBlue: input.accent_blue,
    toneFormality: input.tone_formality,
    toneCadence: input.tone_cadence,
    allowedProofClaims: input.allowed_proof_claims,
    ...(input.visual_assets ? { visualAssets: input.visual_assets as import("@prisma/client").Prisma.InputJsonValue } : {}),
  };

  const profile = await prisma.brandProfile.upsert({
    where: { clientId },
    update: data,
    create: { clientId, ...data },
  });

  const directives = await prisma.brandDirective
    .findMany({
      where: { clientId, category: { not: "DISTRIBUTION" } },
      orderBy: { createdAt: "asc" },
    })
    .catch(() => []);

  const forbiddenWords = directives
    .filter((d) => d.category === "FORBIDDEN")
    .map((d) => d.instruction.trim())
    .filter(Boolean);

  const dynamicBannedLexicon = Array.from(
    new Set([...forbiddenWords, ...STATIC_BANNED_LEXICON])
  );

  const dto = toBrandSettingsDTO(profile);
  dto.tone_guidelines.banned_lexicon = dynamicBannedLexicon;

  return {
    ...dto,
    directives: directives.map(toDirectiveDTO),
  };
}
