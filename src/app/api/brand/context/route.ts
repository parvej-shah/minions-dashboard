import { NextResponse } from "next/server";
import { getBrandSettings } from "@/services/brand";
import { BLOG_BASE_URL } from "@/constants/config";
import { apiError } from "@/lib/api-response";

/**
 * Structured brand context for the n8n drafting pipeline to ingest.
 * Sourced from the same `getBrandSettings()` the /api/brand and Brand Profile
 * tab use, so this cannot drift from what an operator edits there.
 */
export async function GET() {
  try {
    const brand = await getBrandSettings();

    return NextResponse.json({
      company_name: brand.brand_name,
      brand_domain: BLOG_BASE_URL,
      positioning: brand.positioning,
      primary_logo_url: brand.primary_logo_url,
      colors: {
        primary_ink: brand.primary_ink,
        brand_teal: brand.brand_teal,
        brand_coral: brand.brand_coral,
        brand_cream: brand.brand_cream,
      },
      voice_guidelines: {
        cadence: brand.tone_guidelines.cadence,
        forbidden_lexicon: brand.tone_guidelines.banned_lexicon,
        allowed_proof: brand.tone_guidelines.allowed_proof_claims,
      },
      directives: (brand.directives ?? [])
        .filter((d) => d.is_active)
        .sort((a, b) => a.priority - b.priority),
    });
  } catch (error) {
    return apiError(error, "Failed to build brand context");
  }
}
