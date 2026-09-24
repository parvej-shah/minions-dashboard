import { normalizeDomain } from "@/constants/config";
import { writerExpertisePromptGuidance } from "@/constants/writerExpertise";
import type { BrandSettings } from "@/types/brand";
import type { HarvestContext, WriterVoiceConfig } from "@/services/brand";
import { planHarvest } from "@/lib/harvest/plan";

/**
 * The body of GET /api/brand/context: everything the n8n harvester and
 * drafter read about a tenant.
 *
 * Kept as a pure function so the n8n contract tests can build the REAL
 * response shape from typed inputs. The refine step in 01_idea_harvester read
 * a field this response never had, and nothing noticed for weeks; a test that
 * feeds this function's output into the Code node catches that class of
 * mismatch at build time.
 */
export function buildBrandContextResponse(
  brand: BrandSettings,
  voiceConfig: WriterVoiceConfig,
  harvest: HarvestContext
) {
  return {
    company_name: brand.brand_name,
    // The tenant's OWN public site, or null when it has none. Falling back to
    // BLOG_BASE_URL advertised getminions.ai on other tenants' posts.
    brand_domain: normalizeDomain(brand.company_domain),
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
    // The authority flywheel inputs (docs/product/authority-flywheel-plan.md).
    // icp: the ONE reader this tenant writes for. professional_memory: what
    // the author has actually lived; an idea must rest on it (or on approved
    // proof) to pass the authority gate. content_lanes: what the tenant
    // publishes and why -- refine assigns every idea to one of these.
    icp: harvest.author.icp,
    professional_memory: harvest.author.memory,
    content_lanes: harvest.author.lanes,
    // What each idea this run is built on, chosen in code to keep the
    // tenant's source mix (phase 3). One slot per angle in pillar_rotation.
    // Memory is referred to as M1.. in professional_memory order, proof as
    // P1.. in voice_guidelines.allowed_proof order.
    harvest_plan: planHarvest({
      memory: harvest.author.memory,
      icp: harvest.author.icp,
      angles: harvest.pillarRotation,
      mix: harvest.sourceMix,
      recentSourceTypes: harvest.recentSourceTypes,
      recentMemoryIds: harvest.recentMemoryIds,
      hasMarketSources: harvest.sources.length > 0,
      runIndex: harvest.runIndex,
    }),
    // Health of this response. `context_complete` is false when any piece of
    // harvest context fell back to a default -- a missing column, an
    // unmigrated database, a stale Prisma client. The harvester checks it and
    // aborts rather than running on fallback feeds and fixed pillars, which
    // is what produced repetitive off-target ideas while every run reported
    // success. `degraded` names what failed, for the log line.
    context_complete: harvest.degraded.length === 0,
    degraded: harvest.degraded,
  };
}

export type BrandContextResponse = ReturnType<typeof buildBrandContextResponse>;
