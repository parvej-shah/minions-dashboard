import { prisma } from "@/lib/prisma";
import { DEFAULT_BRAND_SETTINGS } from "@/constants/brand";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { toBrandSettingsDTO } from "@/lib/mappers/brandProfile";
import type { BrandProfileInput, BrandSettings } from "@/types";

/**
 * Brand settings plus the live directive set, scoped to one tenant.
 *
 * Company info, voice guidelines, and colors come from that tenant's
 * `brand_profile` row; if it has never been seeded, the hardcoded seed
 * constant fills in so the page still renders something editable instead of
 * erroring. `brand_profile` used to be a single global singleton row keyed by
 * a hardcoded id ("BRAND-MINIONS-01") — it is now one row per Client,
 * looked up by the unique `client_id` column instead.
 */
export async function getBrandSettings(clientId: string): Promise<BrandSettings> {
  const [profile, directives] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { clientId } }).catch(() => null),
    prisma.brandDirective
      .findMany({
        where: { clientId, category: { not: "DISTRIBUTION" } },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
  ]);

  const settings = profile
    ? toBrandSettingsDTO(profile)
    : { ...DEFAULT_BRAND_SETTINGS, updated_at: new Date().toISOString() };

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
 * posts, and the claims-gate's CUSTOMER_RESULT override. Kept separate from
 * `getBrandSettings()` / `BrandSettings` so the Brand Studio UI's contract
 * doesn't have to grow fields it doesn't use yet.
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

  return {
    ...toBrandSettingsDTO(profile),
    directives: directives.map(toDirectiveDTO),
  };
}
