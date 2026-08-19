import { prisma } from "@/lib/prisma";
import { DEFAULT_BRAND_SETTINGS } from "@/constants/brand";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { toBrandSettingsDTO } from "@/lib/mappers/brandProfile";
import type { BrandProfileInput, BrandSettings } from "@/types";

const BRAND_PROFILE_ID = "BRAND-MINIONS-01";

/**
 * Brand settings plus the live directive set.
 *
 * Company info, voice guidelines, and colors come from the `brand_profile`
 * row; if it has never been seeded, the hardcoded seed constant fills in so
 * the page still renders something editable instead of erroring.
 */
export async function getBrandSettings(): Promise<BrandSettings> {
  const [profile, directives] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { id: BRAND_PROFILE_ID } }).catch(() => null),
    prisma.brandDirective
      .findMany({ where: { category: { not: "DISTRIBUTION" } }, orderBy: { createdAt: "asc" } })
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

/** Upserts the `brand_profile` singleton row from the Brand Profile tab. */
export async function updateBrandSettings(input: BrandProfileInput): Promise<BrandSettings> {
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
    where: { id: BRAND_PROFILE_ID },
    update: data,
    create: { id: BRAND_PROFILE_ID, ...data },
  });

  const directives = await prisma.brandDirective
    .findMany({ where: { category: { not: "DISTRIBUTION" } }, orderBy: { createdAt: "asc" } })
    .catch(() => []);

  return {
    ...toBrandSettingsDTO(profile),
    directives: directives.map(toDirectiveDTO),
  };
}
