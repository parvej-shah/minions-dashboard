import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { DEFAULT_BRAND_SETTINGS } from "@/constants/brand";
import { BLOG_BASE_URL, BRAND_POSITIONING, PRIMARY_LOGO_URL } from "@/constants/config";
import { apiError } from "@/lib/api-response";

/**
 * Structured brand context for the n8n drafting pipeline to ingest.
 * Values come from the shared brand constants so this cannot drift from /api/brand.
 */
export async function GET() {
  try {
    const directives = await prisma.brandDirective.findMany({
      where: { isActive: true },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json({
      company_name: DEFAULT_BRAND_SETTINGS.brand_name,
      brand_domain: BLOG_BASE_URL,
      positioning: BRAND_POSITIONING,
      primary_logo_url: PRIMARY_LOGO_URL,
      colors: {
        primary_ink: DEFAULT_BRAND_SETTINGS.primary_ink,
        brand_teal: DEFAULT_BRAND_SETTINGS.brand_teal,
        brand_coral: DEFAULT_BRAND_SETTINGS.brand_coral,
        brand_cream: DEFAULT_BRAND_SETTINGS.brand_cream,
      },
      voice_guidelines: {
        cadence: DEFAULT_BRAND_SETTINGS.tone_guidelines.cadence,
        forbidden_lexicon: DEFAULT_BRAND_SETTINGS.tone_guidelines.banned_lexicon,
        allowed_proof: DEFAULT_BRAND_SETTINGS.tone_guidelines.allowed_proof_claims,
      },
      directives: directives.map(toDirectiveDTO),
    });
  } catch (error) {
    return apiError(error, "Failed to build brand context");
  }
}
