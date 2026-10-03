import { apiClient } from "@/lib/api-client";
import type { GeneratedDirective } from "@/lib/ai/brandCopilot";
import { createDirective } from "@/lib/directivesClient";
import { DEFAULT_CADENCE } from "@/lib/scheduling";
import type { WizardFields } from "./onboardingDraft";

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

/** Asks the brand copilot for the brief: positioning plus the rules every draft follows. */
export async function requestBrief(fields: WizardFields, voiceSample: string): Promise<Brief> {
  const res = await apiClient.post<{ directives?: GeneratedDirective[]; positioningSummary?: string }>("/api/onboarding/brand-copilot", {
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
  });
  return { directives: res?.directives ?? [], positioning: res?.positioningSummary ?? "" };
}

/**
 * Writes the workspace: brand, a voice sample the user wrote, the brief's rules
 * and the default schedule. Returns how many voice examples were saved, if any.
 */
export async function saveWorkspace(fields: WizardFields, brief: Brief, voiceSample: string): Promise<number | null> {
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
    writer_expertise: fields.writerExpertise,
    channels: fields.channels,
    preset_id: fields.selectedPresetId,
    logo_url: fields.linkedInProfile?.profilePicture || undefined,
    // The brief already holds rules grounded in these answers; the preset's generic ones would contradict them.
    hasAiDirectives: brief.directives.length > 0,
  });

  const examplesSaved = await saveVoiceSample(fields, voiceSample);

  const failed: string[] = [];
  for (const directive of withinCategoryLimit(brief.directives)) {
    try {
      await createDirective({
        category: directive.category,
        key: directive.rule_key,
        content: directive.instruction,
        priority: directive.priority,
        from_onboarding: true,
      });
    } catch (err) {
      failed.push(directive.rule_key);
      console.warn("Onboarding directive did not save:", err);
    }
  }
  if (failed.length > 0) console.warn(`${failed.length} onboarding directive(s) failed to save: ${failed.join(", ")}`);

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
