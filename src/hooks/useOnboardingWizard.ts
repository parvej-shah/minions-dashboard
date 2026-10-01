import { useState, useEffect } from "react";
import { DEFAULT_CADENCE } from "@/lib/scheduling";
import { useRouter } from "next/navigation";
import { apiClient, toErrorMessage, ApiRequestError } from "@/lib/api-client";
import type { BrandPreset } from "@/constants/brandPresets";
import type { GeneratedDirective } from "@/app/api/onboarding/brand-copilot/route";
import type { LinkedInProfile, AiSuggestions } from "@/app/api/onboarding/voice-import/route";
import { DEFAULT_WRITER_EXPERTISE, type WriterExpertise } from "@/constants/writerExpertise";

export const ONBOARDING_STEPS = ["Your brand", "Your voice", "Start creating"] as const;

const LEGACY_VOICE_DESCRIPTIONS = new Set([
  "Short paragraphs, clear tradeoffs, and a useful next step. No hype.",
  "Teach the why before the how, with calm and precise language.",
  "Lead with a strong point of view, then back it up with reasoning.",
  "Write like a smart colleague: clear, human, and approachable.",
]);

export interface OnboardingWizardState {
  /** False until the saved draft has been read, so the wizard can show a skeleton instead of step 1 flashing. */
  draftRestored: boolean;
  step: number;
  setStep: (step: number) => void;

  // Step 0: LinkedIn & Channels
  linkedInConnected: boolean;
  setLinkedInConnected: (val: boolean) => void;
  channels: string[];
  toggleChannel: (key: string) => void;
  publishingMode: "review" | "auto";
  setPublishingMode: (mode: "review" | "auto") => void;
  importedVoiceCount: number;
  linkedInProfile: LinkedInProfile | null;
  postSnippet: string | null;
  aiSuggestions: AiSuggestions | null;
  selectedVoice: string;
  setSelectedVoice: (val: string) => void;
  customSampleText: string;
  setCustomSampleText: (val: string) => void;
  saveManualVoice: () => Promise<void>;
  importLinkedInVoice: (overrideText?: string) => Promise<void>;

  // Step 1: Company Snapshot
  businessName: string;
  setBusinessName: (val: string) => void;
  businessNameFromLinkedIn: boolean;
  websiteUrl: string;
  setWebsiteUrl: (val: string) => void;
  audienceDescription: string;
  setAudienceDescription: (val: string) => void;
  contentFocus: string;
  setContentFocus: (val: string) => void;
  writerExpertise: WriterExpertise;
  setWriterExpertise: (val: WriterExpertise) => void;
  industry: string;
  setIndustry: (val: string) => void;
  selectedPresetId: string | null;
  setSelectedPresetId: (id: string | null) => void;
  applyPreset: (preset: BrandPreset) => void;
  isGeneratingSuggestions: boolean;
  goToBrandInterview: () => Promise<void>;

  // Step 2: Brand Interview
  mythAnswer: string;
  setMythAnswer: (val: string) => void;
  differentiatorAnswer: string;
  setDifferentiatorAnswer: (val: string) => void;
  avoidAnswer: string;
  setAvoidAnswer: (val: string) => void;
  isGeneratingDirectives: boolean;

  // Step 3: Review Directives & Finalize
  directives: GeneratedDirective[];
  setDirectives: React.Dispatch<React.SetStateAction<GeneratedDirective[]>>;
  toggleDirective: (index: number) => void;
  positioningSummary: string;
  saving: boolean;

  // The first post: one thing from the author's work, drafted at the end of setup.
  storyText: string;
  setStoryText: (val: string) => void;
  storyKind: StoryKind;
  setStoryKind: (val: StoryKind) => void;
  /** Checks the answer, saves the workspace, starts the first draft and opens its screen. */
  writeFirstPost: () => Promise<void>;

  error: string | null;
  setError: (err: string | null) => void;
  goBack: () => void;
}

// One draft per account. The old shared key let a new signup on the same
// browser inherit the previous account's answers and brief, and setup then
// skipped writing a fresh brief because one was already there.
const LEGACY_STORAGE_KEY = "minions_onboarding_draft";
/**
 * A workspace holds at most 6 active rules per category (FORBIDDEN excepted),
 * and setup itself writes one AUDIENCE, TOPICS and POSITIONING rule. Rules past
 * the limit were refused one by one, so keep the brief inside it.
 */
const BRIEF_RULES_PER_CATEGORY = 5;
function withinCategoryLimit(directives: GeneratedDirective[]): GeneratedDirective[] {
  const seen = new Map<string, number>();
  return directives.filter((d) => {
    if (d.category === "FORBIDDEN") return true;
    const n = (seen.get(d.category) ?? 0) + 1;
    seen.set(d.category, n);
    return n <= BRIEF_RULES_PER_CATEGORY;
  });
}

const draftKey = (userId: string) => `${LEGACY_STORAGE_KEY}:${userId}`;

/**
 * Setup no longer asks for a voice; this is the starting voice every new
 * workspace gets ("Direct & practical"), changed later in Brand.
 */
export const DEFAULT_VOICE = "Short paragraphs, clear tradeoffs, and a useful next step. No hype.";

/** What the first-post answer is, as a ProfessionalMemory kind. */
export type StoryKind = "LESSON" | "OPINION" | "CURRENT_WORK";

export function useOnboardingWizard(userId: string): OnboardingWizardState {
  const STORAGE_KEY = draftKey(userId);
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1: Company
  const [businessName, setBusinessNameRaw] = useState("");
  const [businessNameFromLinkedIn, setBusinessNameFromLinkedIn] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [audienceDescription, setAudienceDescription] = useState("");
  const [contentFocus, setContentFocus] = useState("");
  const [writerExpertise, setWriterExpertise] =
    useState<WriterExpertise>(DEFAULT_WRITER_EXPERTISE);
  const [industry, setIndustry] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Step 0: LinkedIn & Channels (Default: ONLY LinkedIn)
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [channels, setChannels] = useState<string[]>(["linkedin"]);
  const [publishingMode, setPublishingMode] = useState<"review" | "auto">("review");
  const [importedVoiceCount, setImportedVoiceCount] = useState(0);
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [postSnippet, setPostSnippet] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestions | null>(null);

  // Step 2: Brand Interview
  const [mythAnswer, setMythAnswer] = useState("");
  const [differentiatorAnswer, setDifferentiatorAnswer] = useState("");
  const [avoidAnswer, setAvoidAnswer] = useState("");
  const [isGeneratingDirectives, setIsGeneratingDirectives] = useState(false);

  // Step 3: Review Directives
  const [directives, setDirectives] = useState<GeneratedDirective[]>([]);
  const [positioningSummary, setPositioningSummary] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [customSampleText, setCustomSampleText] = useState("");

  const [saving, setSaving] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyKind, setStoryKind] = useState<StoryKind>("LESSON");
  const [error, setError] = useState<string | null>(null);
  // Do not let the persistence effect overwrite a returned OAuth wizard
  // state with defaults before the restore effect has finished reading it.
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  function setBusinessName(val: string) {
    setBusinessNameRaw(val);
    setBusinessNameFromLinkedIn(false); // user manually edited — clear flag
  }

  // Restore draft state from localStorage on mount
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessNameRaw(parsed.businessName);
        if (parsed.businessNameFromLinkedIn) setBusinessNameFromLinkedIn(parsed.businessNameFromLinkedIn);
        if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl);
        if (parsed.audienceDescription) setAudienceDescription(parsed.audienceDescription);
        if (parsed.contentFocus) setContentFocus(parsed.contentFocus);
        if (parsed.writerExpertise) setWriterExpertise(parsed.writerExpertise);
        if (parsed.industry) setIndustry(parsed.industry);
        if (parsed.selectedPresetId) setSelectedPresetId(parsed.selectedPresetId);
        if (parsed.channels && Array.isArray(parsed.channels)) setChannels(parsed.channels);
        if (parsed.publishingMode === "review" || parsed.publishingMode === "auto") setPublishingMode(parsed.publishingMode);
        if (parsed.mythAnswer) setMythAnswer(parsed.mythAnswer);
        if (parsed.differentiatorAnswer) setDifferentiatorAnswer(parsed.differentiatorAnswer);
        if (parsed.avoidAnswer) setAvoidAnswer(parsed.avoidAnswer);
        if (typeof parsed.selectedVoice === "string") setSelectedVoice(parsed.selectedVoice);
        if (typeof parsed.customSampleText === "string") {
          // Drafts created before voice and instruction were separate stored the
          // selected card description in this field. Keep those selections intact.
          if (!parsed.selectedVoice && LEGACY_VOICE_DESCRIPTIONS.has(parsed.customSampleText)) {
            setSelectedVoice(parsed.customSampleText);
          } else {
            setCustomSampleText(parsed.customSampleText);
          }
        }
        if (typeof parsed.step === "number") setStep(parsed.step);
        if (parsed.linkedInProfile) setLinkedInProfile(parsed.linkedInProfile);
        if (parsed.postSnippet) setPostSnippet(parsed.postSnippet);
        if (parsed.aiSuggestions) setAiSuggestions(parsed.aiSuggestions);
        if (parsed.importedVoiceCount) setImportedVoiceCount(parsed.importedVoiceCount);
        if (Array.isArray(parsed.directives)) setDirectives(parsed.directives);
        if (typeof parsed.positioningSummary === "string") setPositioningSummary(parsed.positioningSummary);
        if (typeof parsed.storyText === "string") setStoryText(parsed.storyText);
        if (parsed.storyKind === "LESSON" || parsed.storyKind === "OPINION" || parsed.storyKind === "CURRENT_WORK") setStoryKind(parsed.storyKind);
      }
    } catch {}
    finally {
      setHasRestoredDraft(true);
    }
  }, [STORAGE_KEY]);

  // Prefill from the already-saved BrandProfile/directives, for a user who
  // lands here a second time (e.g. redirected back by DashboardShell) with no
  // localStorage draft -- previously the form was just blank in that case,
  // even though their data was sitting in the DB the whole time. Only fills
  // fields still at their empty default, so an in-progress draft always wins.
  useEffect(() => {
    if (!hasRestoredDraft) return;
    let cancelled = false;
    (async () => {
      try {
        const [brand, directiveRows] = await Promise.all([
          apiClient.get<{
            brand_name?: string;
            company_domain?: string;
            positioning?: string;
            writer_expertise?: WriterExpertise;
          }>("/api/brand"),
          apiClient
            .get<Array<{ category: string; key: string; content: string; priority: 1 | 2 | 3 }>>(
              "/api/brand/directives"
            )
            .catch(() => []),
        ]);
        if (cancelled || !brand?.positioning) return;

        setBusinessNameRaw((prev) =>
          prev || (brand.brand_name && brand.brand_name !== "getminions.ai" ? brand.brand_name : prev)
        );
        setWebsiteUrl((prev) =>
          prev || (brand.company_domain && brand.company_domain !== "getminions.ai" ? brand.company_domain : prev)
        );
        setWriterExpertise((prev) => prev || brand.writer_expertise || prev);
        setPositioningSummary((prev) => prev || brand.positioning || prev);
        if (Array.isArray(directiveRows) && directiveRows.length > 0) {
          setDirectives((prev) =>
            prev.length > 0
              ? prev
              : directiveRows.map((d) => ({
                  category: d.category as GeneratedDirective["category"],
                  rule_key: d.key,
                  instruction: d.content,
                  priority: d.priority,
                }))
          );
        }
      } catch {
        // Non-fatal -- worst case the form stays blank, same as before.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasRestoredDraft]);

  // Save draft state to localStorage on changes
  useEffect(() => {
    if (!hasRestoredDraft) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          businessName,
          businessNameFromLinkedIn,
          websiteUrl,
          audienceDescription,
          contentFocus,
          writerExpertise,
          industry,
          selectedPresetId,
          channels,
          publishingMode,
          mythAnswer,
          differentiatorAnswer,
          avoidAnswer,
          selectedVoice,
          customSampleText,
          step,
          linkedInProfile,
          postSnippet,
          aiSuggestions,
          importedVoiceCount,
          directives,
          positioningSummary,
          storyText,
          storyKind,
        })
      );
    } catch {}
  }, [storyText, storyKind, businessName, businessNameFromLinkedIn, websiteUrl, audienceDescription, contentFocus, writerExpertise, industry, selectedPresetId, channels, publishingMode, mythAnswer, differentiatorAnswer, avoidAnswer, selectedVoice, customSampleText, step, linkedInProfile, postSnippet, aiSuggestions, importedVoiceCount, directives, positioningSummary, hasRestoredDraft, STORAGE_KEY]);

  function applyPreset(preset: BrandPreset) {
    setSelectedPresetId(preset.id);
    setIndustry(preset.industry);
  }

  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  async function goToBrandInterview() {
    setStep(1);
  }

  function toggleChannel(key: string) {
    setChannels((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  async function saveManualVoice() {
    const sample = [selectedVoice, customSampleText.trim()].filter(Boolean).join(" ");
    if (sample.length < 20) {
      setError("Add a little more writing so Minions has enough context to learn your voice.");
      return;
    }

    setError(null);
    try {
      const res = await apiClient.post<{ success: boolean; examples_saved: number }>("/api/onboarding/voice", {
        examples: [sample],
      });
      if (res.success) {
        setImportedVoiceCount(res.examples_saved);
        setPostSnippet(sample.slice(0, 160));
      }
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't save your writing sample. Please try again."));
    }
  }

  async function importLinkedInVoice(overrideText?: string) {
    setError(null);
    try {
      const textToPass = overrideText !== undefined ? overrideText : [selectedVoice, customSampleText.trim()].filter(Boolean).join(" ");
      const res: any = await apiClient.post("/api/onboarding/voice-import", {
        customSampleText: textToPass,
        // Only non-empty if the user already filled in Step 2 and came back
        // to re-sync -- fine either way, the route treats it as optional.
        websiteUrl: websiteUrl.trim(),
      });
      if (res?.success) {
        setImportedVoiceCount(res.importedCount || 1);
        setLinkedInConnected(true);

        // Store full profile data for display
        if (res.profile) {
          setLinkedInProfile(res.profile);
        }

        // Store AI-generated suggestions for brand interview chips
        if (res.aiSuggestions) {
          setAiSuggestions(res.aiSuggestions);
        }

        // Auto-fill company/business name ONLY if explicitly returned by LinkedIn API
        if (res.profile?.company && !businessName.trim()) {
          setBusinessNameRaw(res.profile.company);
          setBusinessNameFromLinkedIn(true);
        }

        // Store first post snippet for preview
        if (res.postSnippet) setPostSnippet(res.postSnippet);
      }
    } catch (err) {
      console.warn("Voice import error:", err);
      // A 409 here means the stored LinkedIn token itself expired (the backend
      // already cleared the credential) -- drop back to "Connect with 1-Click"
      // instead of pretending the import succeeded.
      if (err instanceof ApiRequestError && err.status === 409) {
        setLinkedInConnected(false);
        setError(err.message);
      } else {
        setError(toErrorMessage(err, "Couldn't import your LinkedIn voice. Please try again."));
      }
    }
  }

  /** Asks the brand copilot for the brief: positioning plus the rules every draft follows. */
  async function requestBrief(voiceSample: string) {
    const res = await apiClient.post<{ directives?: GeneratedDirective[]; positioningSummary?: string }>(
      "/api/onboarding/brand-copilot",
      {
        industry,
        businessName: businessName.trim() || "Our Company",
        websiteUrl: websiteUrl.trim(),
        audienceDescription: audienceDescription.trim(),
        contentFocus: contentFocus.trim(),
        writerExpertise,
        voiceSample,
        mythAnswer,
        differentiatorAnswer,
        avoidAnswer,
        selectedPresetId,
        headline: linkedInProfile?.headline || undefined,
      }
    );
    return { directives: res?.directives ?? [], positioning: res?.positioningSummary ?? "" };
  }

  /** Writes the workspace: voice sample, brand, the brief's rules and the default schedule. */
  async function saveWorkspace(brief: { directives: GeneratedDirective[]; positioning: string }, voiceSample: string) {
    await apiClient.post("/api/onboarding/setup", {
      // Without these the tenant kept the "<email-local-part>'s Workspace"
      // placeholder name and an empty domain, which covers and public post
      // URLs then displayed. Setup no longer asks for them, so they are only
      // sent when a returning draft still has them.
      business_name: businessName.trim(),
      website_url: websiteUrl.trim(),
      industry: industry.trim() || "General Business",
      // The reader the user described in setup. The brief's positioning is
      // about the writer, not the reader; sent here it replaced their answer.
      icp_description: audienceDescription.trim() || brief.positioning || `${businessName || "My Brand"} provides ${industry} solutions.`,
      content_focus: contentFocus.trim(),
      writer_expertise: writerExpertise,
      channels,
      preset_id: selectedPresetId,
      logo_url: linkedInProfile?.profilePicture || undefined,
      // Skip the preset's generic template directives: the brief already
      // produced real ones grounded in these answers, and the two contradict.
      hasAiDirectives: brief.directives.length > 0,
    });

    // After setup: the voice route needs the workspace, which setup creates
    // for a new user. Before it, the sample was refused and silently lost.
    if (voiceSample.length >= 20 && importedVoiceCount === 0) {
      try {
        const res = await apiClient.post<{ success: boolean; examples_saved: number }>("/api/onboarding/voice", {
          examples: [voiceSample],
        });
        if (res.success) setImportedVoiceCount(res.examples_saved);
      } catch (voiceErr) {
        console.warn("Onboarding voice sample save non-fatal:", voiceErr);
      }
    }

    const failures: string[] = [];
    for (const dir of withinCategoryLimit(brief.directives)) {
      try {
        await apiClient.post("/api/brand/directives", {
          category: dir.category,
          key: dir.rule_key,
          content: dir.instruction,
          priority: dir.priority,
          audience_scope: "ALL",
          from_onboarding: true,
        });
      } catch (e) {
        failures.push(dir.rule_key);
        console.warn("Directive creation non-fatal:", e);
      }
    }
    if (failures.length > 0) {
      console.warn(`${failures.length} onboarding directive(s) failed to save: ${failures.join(", ")}`);
    }

    await apiClient.patch("/api/schedule", {
      // 3 posts a week (plan decision D5).
      cadence_type: DEFAULT_CADENCE.cadenceType,
      interval_days: DEFAULT_CADENCE.intervalDays,
      days_of_week: DEFAULT_CADENCE.daysOfWeek,
      posts_per_day: DEFAULT_CADENCE.postsPerDay,
      times_of_day: DEFAULT_CADENCE.timesOfDay,
      require_review: publishingMode === "review",
      is_active: true,
      from_onboarding: true,
    });
  }

  async function writeFirstPost() {
    setError(null);
    const story = storyText.trim();
    setIsGeneratingDirectives(true);
    try {
      // Checked first: once the workspace is saved, setup can't be re-run.
      await apiClient.post("/api/onboarding/first-post", { validate: true, story, kind: storyKind });
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't use that answer. Please try again."));
      setIsGeneratingDirectives(false);
      return;
    }

    setSaving(true);
    try {
      const voiceSample = [selectedVoice || DEFAULT_VOICE, customSampleText.trim()].filter(Boolean).join(" ");
      const brief = directives.length > 0 ? { directives, positioning: positioningSummary } : await requestBrief(voiceSample);
      setDirectives(brief.directives);
      setPositioningSummary(brief.positioning);
      // Only text the user wrote is a writing sample. The voice description
      // guides the brief, but saved as a sample it showed in Brand as a post
      // "you genuinely wrote" and the writer imitated a one-line instruction.
      await saveWorkspace(brief, customSampleText.trim());

      // The workspace exists from here on. A failed start is recoverable on
      // the first-post screen, which offers a retry.
      await apiClient.post("/api/onboarding/first-post", { story, kind: storyKind }).catch((e) => {
        console.warn("First post start failed; the first-post screen will offer a retry:", e);
      });
      // More ideas arrive in the background while the first post is written.
      apiClient.post("/api/pipeline/harvest", {}).catch((e) => console.warn("Initial harvest trigger non-fatal:", e));

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      router.replace("/onboarding/first-post");
    } catch (err) {
      setError(toErrorMessage(err, "Could not finish setting up. Please try again."));
      setSaving(false);
      setIsGeneratingDirectives(false);
    }
  }

  function toggleDirective(index: number) {
    setDirectives((prev) => prev.filter((_, i) => i !== index));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  return {
    draftRestored: hasRestoredDraft,
    step,
    setStep,
    businessName,
    setBusinessName,
    businessNameFromLinkedIn,
    websiteUrl,
    setWebsiteUrl,
    audienceDescription,
    setAudienceDescription,
    contentFocus,
    setContentFocus,
    writerExpertise,
    setWriterExpertise,
    industry,
    setIndustry,
    selectedPresetId,
    setSelectedPresetId,
    applyPreset,
    isGeneratingSuggestions,
    goToBrandInterview,
    linkedInConnected,
    setLinkedInConnected,
    channels,
    toggleChannel,
    publishingMode,
    setPublishingMode,
    importedVoiceCount,
    linkedInProfile,
    postSnippet,
    aiSuggestions,
    selectedVoice,
    setSelectedVoice,
    customSampleText,
    setCustomSampleText,
    saveManualVoice,
    importLinkedInVoice,
    mythAnswer,
    setMythAnswer,
    differentiatorAnswer,
    setDifferentiatorAnswer,
    avoidAnswer,
    setAvoidAnswer,
    isGeneratingDirectives,
    directives,
    setDirectives,
    toggleDirective,
    positioningSummary,
    saving,
    error,
    setError,
    goBack,
    storyText,
    setStoryText,
    storyKind,
    setStoryKind,
    writeFirstPost,
  };
}
