import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBrandSettings, getWriterVoiceConfig, getHarvestContext } from "@/services/brand";
import { BLOG_BASE_URL, normalizeDomain } from "@/constants/config";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { writerExpertisePromptGuidance } from "@/constants/writerExpertise";

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
    // The webhook secret authenticates the *caller* (n8n), not a tenant, and n8n
    // legitimately harvests for every tenant -- so this cannot be narrowed to one
    // clientId. What it can do is refuse ids that name no live tenant, so a typo
    // or a stale id fails loudly here instead of further downstream, where
    // getBrandSettings' fallback would hand back a plausible-looking default
    // profile for a tenant that does not exist.
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, status: true },
    });
    if (!client) {
      return apiFailure("Unknown clientId", 404);
    }
    if (client.status !== "ACTIVE") {
      return apiFailure(`Tenant ${clientId} is ${client.status}, not ACTIVE`, 409);
    }

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
      // The AUTHOR's standing in their field, set once in onboarding. Governs
      // what a draft may claim as evidence (lived experience vs. cited work)
      // and how assertive it may be. Reading level is a separate axis and
      // comes from the audience/positioning directives, so a beginner writing
      // for specialists stays expressible.
      writer_expertise: harvest.writerExpertise,
      writer_expertise_guidance: writerExpertisePromptGuidance(harvest.writerExpertise),
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
      // Health of this response. `context_complete` is false when any piece of
      // harvest context fell back to a default -- a missing column, an
      // unmigrated database, a stale Prisma client. The harvester checks it and
      // aborts rather than running on fallback feeds and fixed pillars, which
      // is what produced repetitive off-target ideas while every run reported
      // success. `degraded` names what failed, for the log line.
      context_complete: harvest.degraded.length === 0,
      degraded: harvest.degraded,
    });
  } catch (error) {
    return apiError(error, "Failed to build brand context");
  }
}
