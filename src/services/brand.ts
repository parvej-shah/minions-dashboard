import { prisma } from "@/lib/prisma";
import { STATIC_BANNED_LEXICON } from "@/constants/brand";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { toBrandSettingsDTO } from "@/lib/mappers/brandProfile";
import { DEFAULT_COVER_ART_STYLE } from "@/lib/covers/artStyles";
import type { BrandProfileInput, BrandSettings } from "@/types";
import { resolveWriterExpertise, DEFAULT_WRITER_EXPERTISE, type WriterExpertise } from "@/constants/writerExpertise";
import { resolveSourceFeedUrl } from "@/constants/ideaSources";
import { selectAnglesForRun } from "@/constants/contentAngles";
import { thesisKey, restemKey } from "@/lib/thesis";
import { getAuthorContext, EMPTY_ICP, type AuthorContext } from "@/services/authorContext";
import { resolveSourceMix, type SourceBucket } from "@/constants/sourceMix";

/**
 * Brand settings plus the live directive set, scoped to one tenant.
 *
 * Company info, voice guidelines, and colors come from that tenant's
 * `brand_profile` row; if it has never been seeded, the hardcoded seed
 * constant fills in so the page still renders something editable instead of
 * erroring.
 */
export async function getBrandSettings(clientId: string): Promise<BrandSettings> {
  const [profile, directives, client] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { clientId } }).catch(() => null),
    prisma.brandDirective
      .findMany({
        where: { clientId, category: { not: "DISTRIBUTION" } },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
    prisma.client.findUnique({ where: { id: clientId } }).catch(() => null),
  ]);

  const clientName = client?.name || "My Brand";

  const forbiddenWords = directives
    .filter((d) => d.category === "FORBIDDEN")
    .map((d) => d.instruction.trim())
    .filter(Boolean);

  const dynamicBannedLexicon = Array.from(
    new Set([...forbiddenWords, ...STATIC_BANNED_LEXICON])
  );

  const settings = profile
    ? toBrandSettingsDTO(profile)
    : {
        id: `BRAND-${clientId}`,
        brand_name: clientName,
        company_domain: "",
        positioning: "",
        primary_logo_url: "",
        cover_byline: "",
        cover_art: DEFAULT_COVER_ART_STYLE,
        primary_ink: "#0B0F14",
        brand_teal: "#00D4AA",
        brand_coral: "#FF6B4A",
        brand_cream: "#F5F7FA",
        accent_blue: "#7C8CFF",
        tone_guidelines: {
          formality: "Technical & Direct",
          cadence: "Concise, structured paragraphs with clear technical reasoning.",
          banned_lexicon: dynamicBannedLexicon,
          allowed_proof_claims: [],
        },
        writer_expertise: DEFAULT_WRITER_EXPERTISE,
        thumbnail_layout: {
          visual_style: "Executive Studio Lighting (Dark slate background, subtle rim lighting)",
          show_badge: true,
          show_logo: false,
          title_word_count_min: 3,
          title_word_count_max: 6,
        },
        updated_at: new Date().toISOString(),
      };

  settings.tone_guidelines.banned_lexicon = dynamicBannedLexicon;

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
 * posts, and the claims-gate's CUSTOMER_RESULT override.
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
    ...(input.cover_byline !== undefined ? { coverByline: input.cover_byline.trim() || null } : {}),
    ...(input.cover_art !== undefined ? { coverArt: input.cover_art } : {}),
    primaryInk: input.primary_ink,
    brandTeal: input.brand_teal,
    brandCoral: input.brand_coral,
    brandCream: input.brand_cream,
    accentBlue: input.accent_blue,
    toneFormality: input.tone_formality,
    toneCadence: input.tone_cadence,
    allowedProofClaims: input.allowed_proof_claims,
    ...(input.writer_expertise ? { writerExpertise: input.writer_expertise } : {}),
    ...(input.visual_assets ? { visualAssets: input.visual_assets as import("@prisma/client").Prisma.InputJsonValue } : {}),
  };

  const profile = await prisma.brandProfile.upsert({
    where: { clientId },
    update: data,
    create: { clientId, ...data },
  });

  // Keep Client.name in step with the brand name. They are shown in different
  // places -- Client.name in the sidebar and workspace switcher, brandName on
  // generated images and in pipeline prompts -- and letting them diverge is
  // how a tenant ends up renamed everywhere except its own cover art.
  if (input.brand_name) {
    await prisma.client
      .update({ where: { id: clientId }, data: { name: input.brand_name } })
      .catch(() => {});
  }

  const directives = await prisma.brandDirective
    .findMany({
      where: { clientId, category: { not: "DISTRIBUTION" } },
      orderBy: { createdAt: "asc" },
    })
    .catch(() => []);

  const forbiddenWords = directives
    .filter((d) => d.category === "FORBIDDEN")
    .map((d) => d.instruction.trim())
    .filter(Boolean);

  const dynamicBannedLexicon = Array.from(
    new Set([...forbiddenWords, ...STATIC_BANNED_LEXICON])
  );

  const dto = toBrandSettingsDTO(profile);
  dto.tone_guidelines.banned_lexicon = dynamicBannedLexicon;

  return {
    ...dto,
    directives: directives.map(toDirectiveDTO),
  };
}


export interface HarvestSource {
  id: string;
  label: string;
  kind: string;
  feed_url: string;
  max_items: number;
}

export interface HarvestContext {
  /**
   * Names of the context pieces that failed to load and fell back to a default.
   * Empty on a healthy run. Surfaced through /api/brand/context so the harvester
   * can refuse to run on degraded context rather than silently producing
   * repetitive, un-targeted ideas.
   */
  degraded: string[];
  writerExpertise: WriterExpertise;
  sources: HarvestSource[];
  recentTheses: string[];
  pillarRotation: { id: string; pillar: string; brief: string }[];
  /** Monotonic per-tenant harvest counter, used to rotate feed windows. */
  runIndex: number;
  /** ICP, professional memory and content lanes (authority flywheel, phase 1). */
  author: AuthorContext;
  /** Target share per idea source; the harvest plan keeps to it (phase 3). */
  sourceMix: Record<SourceBucket, number>;
  /** source_type, memory_ids and angle of the same recent ideas, newest first: what the mix and memory rotation count. */
  recentSourceTypes: (string | null)[];
  recentMemoryIds: string[][];
  recentAngles: (string | null)[];
}

/**
 * The harvester-specific slice of tenant context: which feeds to pull, which
 * angles this run should take, and what NOT to repeat.
 *
 * Each piece here fixes one cause of the repetition the idea stream suffered:
 *  - `sources` were four URLs hardcoded in n8n and shared by every tenant.
 *  - `pillarRotation` replaces a fixed three-angle scaffold that made the
 *    prompt's own "rotate structures" instruction impossible to obey.
 *  - `recentTheses` are the MOST RECENT ideas. The workflow's Build Harvest
 *    Payload node did `.slice(-40)` on a `created_at.desc` array, which takes
 *    the *oldest* forty rows -- so the model was shown ancient ideas and was
 *    blind to everything it had generated lately.
 */
export async function getHarvestContext(clientId: string): Promise<HarvestContext> {
  /**
   * Each query degrades to a safe empty value so one missing table can't fail a
   * whole harvest -- but it must SAY SO. Swallowing these silently is how a
   * stale Prisma client and an undeployed migration both went unnoticed: the
   * route answered 200 with empty sources and no rotation, the harvester fell
   * back to its hardcoded feeds and fixed pillars, and every run looked green
   * while the anti-repetition work was entirely inert.
   */
  const degraded: string[] = [];
  const soft = <T>(label: string, fallback: T) => (err: unknown) => {
    degraded.push(label);
    console.error(
      `[harvest-context] ${label} failed for client ${clientId} -- falling back. ` +
        `The harvest will run with reduced context.`,
      err
    );
    return fallback;
  };

  const [profile, sourceRows, recentIdeas, runCount, author] = await Promise.all([
    prisma.brandProfile
      .findUnique({ where: { clientId }, select: { writerExpertise: true, harvestSourceMix: true } })
      .catch(soft("writerExpertise", null)),
    prisma.ideaSource
      .findMany({ where: { clientId, isActive: true }, orderBy: { createdAt: "asc" } })
      .catch(soft("ideaSources", [])),
    prisma.idea
      .findMany({
        // Ideas the gate dropped were never produced, so they count toward
        // neither the mix nor the do-not-repeat list. Ideas a PERSON rejected
        // still count: they are exactly what should not come back.
        where: { clientId, OR: [{ gateVerdict: null }, { gateVerdict: { not: "REJECT" } }] },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: { rawIdea: true, angle: true, thesisKey: true, sourceType: true, memoryIds: true },
      })
      .catch(soft("recentTheses", [])),
    prisma.pipelineRun
      .count({ where: { clientId, type: "HARVEST" } })
      .catch(soft("harvestRunCount", 0)),
    // A missing table here (migration not applied yet) must degrade loudly:
    // the harvester refuses to run rather than harvest without lanes.
    getAuthorContext(clientId).catch(soft("authorContext", { icp: EMPTY_ICP, memory: [], lanes: [] } as AuthorContext)),
  ]);

  const sources = sourceRows
    .map((row) => {
      const feedUrl = resolveSourceFeedUrl(row);
      return feedUrl
        ? {
            id: row.id,
            label: row.label,
            kind: row.kind,
            feed_url: feedUrl,
            max_items: row.maxItems,
          }
        : null;
    })
    .filter((s): s is HarvestSource => s !== null);

  const recentTheses = recentIdeas
    .map((i) => (i.thesisKey ? restemKey(i.thesisKey) : thesisKey(i.rawIdea, i.angle)))
    .filter(Boolean);

  return {
    degraded,
    writerExpertise: resolveWriterExpertise(profile?.writerExpertise),
    sources,
    recentTheses: Array.from(new Set(recentTheses)),
    pillarRotation: selectAnglesForRun(runCount),
    runIndex: runCount,
    author,
    sourceMix: resolveSourceMix(profile?.harvestSourceMix),
    recentSourceTypes: recentIdeas.map((i) => i.sourceType),
    recentMemoryIds: recentIdeas.map((i) => i.memoryIds),
    recentAngles: recentIdeas.map((i) => i.angle),
  };
}
