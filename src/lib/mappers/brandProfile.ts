import type { BrandProfile } from "@prisma/client";
import type { BrandSettings } from "@/types";
import { STATIC_BANNED_LEXICON } from "@/constants/brand";

/** Prisma `brand_profile` row -> the /api/brand wire shape (minus directives). */
export function toBrandSettingsDTO(
  row: BrandProfile
): Omit<BrandSettings, "directives"> {
  return {
    id: row.id,
    brand_name: row.brandName,
    company_domain: row.companyDomain,
    positioning: row.positioning,
    primary_logo_url: row.primaryLogoUrl,
    primary_ink: row.primaryInk,
    brand_teal: row.brandTeal,
    brand_coral: row.brandCoral,
    brand_cream: row.brandCream,
    accent_blue: row.accentBlue,
    tone_guidelines: {
      formality: row.toneFormality as BrandSettings["tone_guidelines"]["formality"],
      cadence: row.toneCadence,
      // Not yet editable from the Brand Profile tab — kept static per current scope.
      banned_lexicon: STATIC_BANNED_LEXICON,
      allowed_proof_claims: row.allowedProofClaims,
    },
    thumbnail_layout: {
      visual_style:
        "Tactile Commercial Studio Flat-Lay (Stitched leather clipboard, metallic mechanical clip, dark slate tabletop, volumetric rim lighting)",
      show_badge: true,
      show_logo: true,
      title_word_count_min: 3,
      title_word_count_max: 6,
    },
    updated_at: row.updatedAt.toISOString(),
  };
}
