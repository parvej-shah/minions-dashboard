import type { BrandProfileInput, BrandSettings } from "@/types";

export function toProfileInput(settings: BrandSettings): BrandProfileInput {
  return {
    brand_name: settings.brand_name,
    company_domain: settings.company_domain,
    positioning: settings.positioning,
    primary_logo_url: settings.primary_logo_url,
    cover_byline: settings.cover_byline,
    cover_art: settings.cover_art,
    cover_cutout_url: settings.cover_cutout_url,
    primary_ink: settings.primary_ink,
    brand_teal: settings.brand_teal,
    brand_coral: settings.brand_coral,
    brand_cream: settings.brand_cream,
    accent_blue: settings.accent_blue,
    tone_formality: settings.tone_guidelines.formality,
    tone_cadence: settings.tone_guidelines.cadence,
    allowed_proof_claims: settings.tone_guidelines.allowed_proof_claims,
  };
}
