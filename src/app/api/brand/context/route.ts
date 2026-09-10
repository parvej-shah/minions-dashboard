import { NextResponse } from "next/server";
import { getBrandSettings, getWriterVoiceConfig } from "@/services/brand";
import { BLOG_BASE_URL } from "@/constants/config";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";

/**
 * Structured brand context for the n8n drafting pipeline to ingest.
 * Sourced from the same `getBrandSettings()` the /api/brand and Brand Profile
 * tab use, so this cannot drift from what an operator edits there.
 *
 * The caller here is n8n (a server-to-server webhook call, not a signed-in
 * browser), so tenancy comes from a `clientId` query param rather than a
 * session — n8n's Assemble Brand Context node passes the client_id it
 * already carries from the workflow trigger payload.
 */
export async function GET(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return apiFailure("clientId query param is required", 400);
  }

  try {
    const [brand, voiceConfig] = await Promise.all([
      getBrandSettings(clientId),
      getWriterVoiceConfig(clientId),
    ]);

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
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 30),
      // Consumed by the Writer prompt (few-shot voice match) and the claims
      // gate (per-tenant CUSTOMER_RESULT override) in 02_idea_to_asset.
      tone_questionnaire: voiceConfig.toneQuestionnaire,
      tone_examples: voiceConfig.toneExamples,
      allow_customer_result_claims: voiceConfig.allowCustomerResultClaims,
      visual_assets: brand.visual_assets,
    });
  } catch (error) {
    return apiError(error, "Failed to build brand context");
  }
}
