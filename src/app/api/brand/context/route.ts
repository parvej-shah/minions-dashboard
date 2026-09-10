import { NextResponse } from "next/server";
import { getBrandSettings, getWriterVoiceConfig, getHarvestContext } from "@/services/brand";
import { BLOG_BASE_URL, normalizeDomain } from "@/constants/config";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { expertisePromptGuidance } from "@/constants/audienceExpertise";

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
    const [brand, voiceConfig, harvest] = await Promise.all([
      getBrandSettings(clientId),
      getWriterVoiceConfig(clientId),
      getHarvestContext(clientId),
    ]);

    return NextResponse.json({
      company_name: brand.brand_name,
      // The tenant's OWN public site, falling back to this company's only when
      // the tenant has not set one. It previously always returned
      // BLOG_BASE_URL, so the publishing pipeline built every tenant's
      // canonical post URLs on getminions.ai.
      brand_domain: normalizeDomain(brand.company_domain) ?? BLOG_BASE_URL,
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
      // Audience depth, set once in onboarding. Both the harvester and the
      // writer read this so idea depth and draft depth cannot drift apart.
      audience_expertise: harvest.audienceExpertise,
      audience_expertise_guidance: expertisePromptGuidance(harvest.audienceExpertise),
      // Per-tenant harvest feeds, replacing the four URLs 01_idea_harvester
      // used to hardcode for every tenant regardless of industry.
      idea_sources: harvest.sources,
      // The most RECENT theses, for the harvester's do-not-repeat list. The
      // old workflow sliced the oldest 40 rows off a descending array, so the
      // model never saw what it had just generated and reliably repeated it.
      recent_theses: harvest.recentTheses,
      // Rotates the pillar set per run so the harvester stops emitting the
      // same Stakes/Myth/How-it-works triplet every single time.
      pillar_rotation: harvest.pillarRotation,
      // Rotates which slice of each feed the harvester reads, so consecutive
      // runs see different signals even when a slow feed publishes nothing new.
      harvest_run_index: harvest.runIndex,
    });
  } catch (error) {
    return apiError(error, "Failed to build brand context");
  }
}
