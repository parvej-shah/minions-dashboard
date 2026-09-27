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
  /** True when this workspace is already onboarded; the wizard must not run. */
  alreadySetUp: boolean;
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
  generateDirectives: () => Promise<void>;

  // Step 3: Review Directives & Finalize
  directives: GeneratedDirective[];
  setDirectives: React.Dispatch<React.SetStateAction<GeneratedDirective[]>>;
  toggleDirective: (index: number) => void;
  positioningSummary: string;
  saving: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  goBack: () => void;
  finalizeOnboarding: () => Promise<void>;
}

const STORAGE_KEY = "minions_onboarding_draft";

export function useOnboardingWizard(): OnboardingWizardState {
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
  const [error, setError] = useState<string | null>(null);
  // Do not let the persistence effect overwrite a returned OAuth wizard
  // state with defaults before the restore effect has finished reading it.
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  function setBusinessName(val: string) {
    setBusinessNameRaw(val);
    setBusinessNameFromLinkedIn(false); // user manually edited — clear flag
  }

  // An established workspace must not be re-onboarded: the wizard rewrites
  // the whole brand. The write routes refuse it too; this just says so before
  // the user fills in every step.
  const [alreadySetUp, setAlreadySetUp] = useState(false);
  useEffect(() => {
    apiClient
      .get<{ established: boolean }>("/api/onboarding/status")
      .then((res) => setAlreadySetUp(res.established === true))
      .catch(() => {});
  }, []);

  // Restore draft state from localStorage on mount
  useEffect(() => {
    try {
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
      }
    } catch {}
    finally {
      setHasRestoredDraft(true);
    }
  }, []);

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
        })
      );
    } catch {}
  }, [businessName, businessNameFromLinkedIn, websiteUrl, audienceDescription, contentFocus, writerExpertise, industry, selectedPresetId, channels, publishingMode, mythAnswer, differentiatorAnswer, avoidAnswer, selectedVoice, customSampleText, step, linkedInProfile, postSnippet, aiSuggestions, importedVoiceCount, directives, positioningSummary, hasRestoredDraft]);

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

  async function generateDirectives() {
    setError(null);
    const voiceSample = [selectedVoice, customSampleText.trim()].filter(Boolean).join(" ");
    if (voiceSample.length < 20) {
      setError("Choose a writing voice or add a short instruction so Minions can make the first drafts sound like you.");
      return;
    }
    setIsGeneratingDirectives(true);
    try {
      const res: any = await apiClient.post("/api/onboarding/brand-copilot", {
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
      });

      if (res?.directives) {
        setDirectives(res.directives);
        setPositioningSummary(res.positioningSummary || "");
        setStep(2);
      }
    } catch (err) {
      setError(toErrorMessage(err, "Failed to generate brand directives with Copilot."));
    } finally {
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

  async function finalizeOnboarding() {
    setError(null);
    setSaving(true);
    try {
      const sample = [selectedVoice, customSampleText.trim()].filter(Boolean).join(" ");
      if (sample.length >= 20 && importedVoiceCount === 0) {
        try {
          const res = await apiClient.post<{ success: boolean; examples_saved: number }>("/api/onboarding/voice", {
            examples: [sample],
          });
          if (res.success) setImportedVoiceCount(res.examples_saved);
        } catch (voiceErr) {
          console.warn("Onboarding voice sample save non-fatal:", voiceErr);
        }
      }

      await apiClient.post("/api/onboarding/setup", {
        // The wizard collected this on step 1 but never sent it, so the tenant
        // kept the "<email-local-part>'s Workspace" placeholder that
        // getOrCreateTenant() assigns before onboarding runs -- and that
        // placeholder is what BrandProfile.brandName, /api/brand/context's
        // company_name, and therefore every generated cover image displayed.
        business_name: businessName.trim(),
        // Collected on step 1 and used to ground the AI suggestions, but never
        // persisted -- so BrandProfile.companyDomain stayed empty and every
        // public post URL fell back to this company's domain.
        website_url: websiteUrl.trim(),
        industry: industry.trim() || "General Business",
        icp_description: positioningSummary || `${businessName || "My Brand"} provides ${industry} solutions.`,
        content_focus: contentFocus.trim(),
        writer_expertise: writerExpertise,
        channels,
        preset_id: selectedPresetId,
        logo_url: linkedInProfile?.profilePicture || undefined,
        // Tell the route to skip writing the preset's generic template
        // directives -- the Brand Interview already produced real ones
        // grounded in this business, and the two used to contradict each other.
        hasAiDirectives: directives.length > 0,
      });

      if (directives.length > 0) {
        const failures: string[] = [];
        for (const dir of directives) {
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

      let harvestRunId: string | undefined;
      try {
        const harvest = await apiClient.post<{ run_id?: string }>("/api/pipeline/harvest", {});
        harvestRunId = harvest.run_id;
      } catch (harvestErr) {
        console.warn("Initial harvest trigger non-fatal:", harvestErr);
      }

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      // The harvest begins here. The Idea Stream is the honest next step: the
      // user sees real opportunities arrive, then chooses what becomes Draft #1.
      router.replace(
        harvestRunId
          ? `/ideas?onboarding_success=true&onboarding_run=${encodeURIComponent(harvestRunId)}`
          : "/ideas?onboarding_success=true"
      );
    } catch (err) {
      setError(toErrorMessage(err, "Could not finalize onboarding. Please try again."));
      setSaving(false);
    }
  }

  return {
    alreadySetUp,
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
    generateDirectives,
    directives,
    setDirectives,
    toggleDirective,
    positioningSummary,
    saving,
    error,
    setError,
    goBack,
    finalizeOnboarding,
  };
}
