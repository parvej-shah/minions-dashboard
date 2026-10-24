import { apiClient } from "@/lib/api-client";
import type { GeneratedDirective } from "@/lib/ai/brandCopilot";
import { createDirective } from "@/lib/directivesClient";
import { DEFAULT_CADENCE } from "@/lib/scheduling";
import type { WizardFields } from "./onboardingDraft";
import { matchKey } from "./brandImport/check";
import type { ImportApproval } from "./brandImport/types";

/**
 * A workspace holds at most 6 active rules per category (FORBIDDEN excepted),
 * and setup itself writes one AUDIENCE, TOPICS and POSITIONING rule. Rules past
 * the limit are refused one by one, so the brief stays inside it.
 */
const BRIEF_RULES_PER_CATEGORY = 5;
const MIN_SAMPLE_CHARS = 20;

export interface Brief {
  directives: GeneratedDirective[];
  positioning: string;
}

export function withinCategoryLimit(directives: GeneratedDirective[]): GeneratedDirective[] {
  const seen = new Map<string, number>();
  return directives.filter((directive) => {
    if (directive.category === "FORBIDDEN") return true;
    const count = (seen.get(directive.category) ?? 0) + 1;
    seen.set(directive.category, count);
    return count <= BRIEF_RULES_PER_CATEGORY;
  });
}

/** What the brand copilot is asked, so a brief already requested for the same answers can be reused. */
export function briefRequest(fields: WizardFields, voiceSample: string) {
  return {
    industry: fields.industry,
    businessName: fields.businessName.trim() || "Our Company",
    websiteUrl: fields.websiteUrl.trim(),
    audienceDescription: fields.audienceDescription.trim(),
    contentFocus: fields.contentFocus.trim(),
    writerExpertise: fields.writerExpertise,
    voiceSample,
    mythAnswer: fields.mythAnswer,
    differentiatorAnswer: fields.differentiatorAnswer,
    avoidAnswer: fields.avoidAnswer,
    selectedPresetId: fields.selectedPresetId,
    headline: fields.linkedInProfile?.headline || undefined,
  };
}

/** Asks the brand copilot for the brief: positioning plus the rules every draft follows. */
export async function requestBrief(request: ReturnType<typeof briefRequest>): Promise<Brief> {
  const res = await apiClient.post<{ directives?: GeneratedDirective[]; positioningSummary?: string }>("/api/onboarding/brand-copilot", request);
  return { directives: res?.directives ?? [], positioning: res?.positioningSummary ?? "" };
}

/**
 * Writes the workspace: brand, a voice sample the user wrote, the brief's rules
 * and the default schedule. Returns how many voice examples were saved, if any.
 *
 * Order matters. Setup creates the workspace, so it goes first. The voice route
 * resets the voice settings, so `afterVoice` (the brand import, which may set
 * them) runs after it. The schedule marks the workspace established, which
 * closes the voice and rule routes, so it goes last. The rest runs side by side.
 */
export async function saveWorkspace(fields: WizardFields, brief: Brief, voiceSample: string, afterVoice?: () => Promise<unknown>): Promise<number | null> {
  const businessName = fields.businessName.trim();
  const industry = fields.industry.trim() || "General Business";

  await apiClient.post("/api/onboarding/setup", {
    business_name: businessName,
    website_url: fields.websiteUrl.trim(),
    industry,
    // The reader the user described. The brief's positioning is about the
    // writer, so it only stands in when they described no reader.
    icp_description: fields.audienceDescription.trim() || brief.positioning || `${businessName || "My Brand"} provides ${industry} solutions.`,
    content_focus: fields.contentFocus.trim(),
    // The brief's positioning is about the writer: what Brand shows as "What you do".
    positioning: brief.positioning.trim(),
    writer_expertise: fields.writerExpertise,
    channels: fields.channels,
    preset_id: fields.selectedPresetId,
    logo_url: fields.linkedInProfile?.profilePicture || undefined,
    // The brief already holds rules grounded in these answers; the preset's generic ones would contradict them.
    hasAiDirectives: brief.directives.length > 0,
  });

  const [examplesSaved] = await Promise.all([
    saveVoiceSample(fields, voiceSample).then(async (saved) => {
      await afterVoice?.();
      return saved;
    }),
    saveDirectives(brief),
  ]);

  await apiClient.patch("/api/schedule", {
    cadence_type: DEFAULT_CADENCE.cadenceType,
    interval_days: DEFAULT_CADENCE.intervalDays,
    days_of_week: DEFAULT_CADENCE.daysOfWeek,
    posts_per_day: DEFAULT_CADENCE.postsPerDay,
    times_of_day: DEFAULT_CADENCE.timesOfDay,
    require_review: fields.publishingMode === "review",
    is_active: true,
    from_onboarding: true,
  });

  return examplesSaved;
}

/** Saves the brief's rules together; withinCategoryLimit already keeps each category under the limit. */
async function saveDirectives(brief: Brief): Promise<void> {
  const directives = withinCategoryLimit(brief.directives);
  const results = await Promise.allSettled(
    directives.map((directive) =>
      createDirective({
        category: directive.category,
        key: directive.rule_key,
        content: directive.instruction,
        priority: directive.priority,
        from_onboarding: true,
      })
    )
  );
  const failed = results.flatMap((r, i) => (r.status === "rejected" ? [directives[i].rule_key] : []));
  if (failed.length > 0) console.warn(`${failed.length} onboarding directive(s) failed to save: ${failed.join(", ")}`);
}

/** The voice route needs the workspace, which setup creates for a new user, so this runs after setup. */
async function saveVoiceSample(fields: WizardFields, voiceSample: string): Promise<number | null> {
  if (voiceSample.length < MIN_SAMPLE_CHARS || fields.importedVoiceCount > 0) return null;
  try {
    const res = await apiClient.post<{ success: boolean; examples_saved: number }>("/api/onboarding/voice", { examples: [voiceSample] });
    return res.success ? res.examples_saved : null;
  } catch (err) {
    console.warn("Onboarding voice sample did not save:", err);
    return null;
  }
}

/**
 * Setup's answers, filled from a brand import where the author typed nothing:
 * the focus becomes what they want to be known for, the audience's "who" the
 * reader, and their own About text the writing sample.
 */
export function fieldsWithImport(fields: WizardFields): WizardFields {
  const found = fields.brandImport;
  if (!found) return fields;
  return {
    ...fields,
    contentFocus: fields.contentFocus.trim() || found.focus?.focus || "",
    audienceDescription: fields.audienceDescription.trim() || found.icp?.who || "",
    industry: fields.industry.trim() || found.focus?.industry || "",
    websiteUrl: fields.websiteUrl.trim() || found.websiteUrl,
    customSampleText: fields.customSampleText.trim() || (fields.keepImportedVoice ? found.voice?.about ?? "" : ""),
  };
}

/** Saves what the author kept from the import. The item their first post came from is skipped; the first post saves it. */
export async function saveImport(fields: WizardFields, story: string): Promise<void> {
  const found = fields.brandImport;
  if (!found) return;
  const storyKey = matchKey(story);
  const approval: ImportApproval = {
    icp: found.icp ? { ...found.icp, who: fields.audienceDescription.trim() || found.icp.who } : null,
    experience: found.experience.filter((item) => !storyKey.includes(matchKey(item.content))).map(({ kind, content }) => ({ kind, content })),
    proofs: found.proofs
      .filter((proof) => fields.approvedProofs.includes(proof.id))
      .map(({ claim, source_url, source_title }) => ({ claim, source_url, source_title })),
    // The About text was saved as the writing sample with the workspace.
    voice: fields.keepImportedVoice && found.voice ? { questionnaire: found.voice.questionnaire, about: null } : null,
    headline: found.identity?.headline || null,
  };
  await apiClient.post("/api/brand/import/apply", approval);
}
