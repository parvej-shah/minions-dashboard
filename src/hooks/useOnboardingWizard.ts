import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, toErrorMessage, ApiRequestError } from "@/lib/api-client";
import type { BrandPreset } from "@/constants/brandPresets";
import type { AiSuggestions, GeneratedDirective } from "@/lib/ai/brandCopilot";
import type { LinkedInProfile } from "@/types";
import type { WriterExpertise } from "@/constants/writerExpertise";
import {
  INITIAL_FIELDS,
  clearDraft,
  draftKey,
  readDraft,
  writeDraft,
  type PublishingMode,
  type StoryKind,
  type WizardFields,
} from "@/lib/onboardingDraft";
import { briefRequest, fieldsWithImport, requestBrief, saveImport, saveWorkspace, type Brief } from "@/lib/onboardingSubmit";
import type { BrandImport } from "@/lib/brandImport/types";

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
  publishingMode: PublishingMode;
  setPublishingMode: (mode: PublishingMode) => void;
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
  /** Starts the brief while the user is still on the story screen; it doesn't depend on the story. */
  prepareBrief: () => void;

  // The brand import: what the LinkedIn PDF and website gave, as edited on the review screen.
  brandImport: BrandImport | null;
  setBrandImport: (val: BrandImport | null) => void;
  approvedProofs: string[];
  toggleProof: (id: string) => void;
  keepImportedVoice: boolean;
  setKeepImportedVoice: (val: boolean) => void;

  error: string | null;
  setError: (err: string | null) => void;
  goBack: () => void;
}

/**
 * Setup does not ask for a voice; every new workspace starts with this one
 * ("Direct & practical") and changes it later in Brand.
 */
const DEFAULT_VOICE = "Short paragraphs, clear tradeoffs, and a useful next step. No hype.";
const MIN_SAMPLE_CHARS = 20;

interface VoiceImportResponse {
  success?: boolean;
  importedCount?: number;
  profile?: LinkedInProfile;
  aiSuggestions?: AiSuggestions;
  postSnippet?: string;
}

interface SavedBrand {
  brand_name?: string;
  company_domain?: string;
  positioning?: string;
}

interface SavedDirective {
  category: GeneratedDirective["category"];
  key: string;
  content: string;
  priority: number;
}

/** The brand name and domain a workspace has before anyone fills them in. */
const PLACEHOLDER_BRAND = "getminions.ai";

export function useOnboardingWizard(userId: string): OnboardingWizardState {
  const storageKey = draftKey(userId);
  const router = useRouter();
  const [fields, setFields] = useState<WizardFields>(INITIAL_FIELDS);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [isGeneratingDirectives, setIsGeneratingDirectives] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The save effect must not write defaults over a draft before it has been read back.
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  const update = useCallback((changes: Partial<WizardFields>) => setFields((prev) => ({ ...prev, ...changes })), []);
  const setter = <K extends keyof WizardFields>(key: K) => (value: WizardFields[K]) => update({ [key]: value } as Partial<WizardFields>);

  useEffect(() => {
    // Deferred so the effect body performs no synchronous setState.
    const restore = setTimeout(() => {
      update(readDraft(storageKey));
      setHasRestoredDraft(true);
    }, 0);
    return () => clearTimeout(restore);
  }, [storageKey, update]);

  useEffect(() => {
    if (hasRestoredDraft) writeDraft(storageKey, fields);
  }, [fields, hasRestoredDraft, storageKey]);

  // A user who lands here again (sent back by DashboardShell) has no draft but
  // may already have a saved brand. Only empty fields are filled, so a draft wins.
  useEffect(() => {
    if (!hasRestoredDraft) return;
    let cancelled = false;
    (async () => {
      try {
        const [brand, directiveRows] = await Promise.all([
          apiClient.get<SavedBrand>("/api/brand"),
          apiClient.get<SavedDirective[]>("/api/brand/directives").catch(() => [] as SavedDirective[]),
        ]);
        if (cancelled || !brand?.positioning) return;
        const saved = (value: string | undefined) => (value && value !== PLACEHOLDER_BRAND ? value : "");
        setFields((prev) => ({
          ...prev,
          businessName: prev.businessName || saved(brand.brand_name),
          websiteUrl: prev.websiteUrl || saved(brand.company_domain),
          positioningSummary: prev.positioningSummary || brand.positioning || "",
          directives:
            prev.directives.length > 0
              ? prev.directives
              : directiveRows.map((d) => ({ category: d.category, rule_key: d.key, instruction: d.content, priority: d.priority })),
        }));
      } catch (err) {
        console.warn("Could not prefill setup from the saved brand:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasRestoredDraft]);

  const voiceSampleText = () => [fields.selectedVoice, fields.customSampleText.trim()].filter(Boolean).join(" ");

  async function saveManualVoice() {
    const sample = voiceSampleText();
    if (sample.length < MIN_SAMPLE_CHARS) {
      setError("Add a little more writing so Minions has enough context to learn your voice.");
      return;
    }
    setError(null);
    try {
      const res = await apiClient.post<{ success: boolean; examples_saved: number }>("/api/onboarding/voice", { examples: [sample] });
      if (res.success) update({ importedVoiceCount: res.examples_saved, postSnippet: sample.slice(0, 160) });
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't save your writing sample. Please try again."));
    }
  }

  async function importLinkedInVoice(overrideText?: string) {
    setError(null);
    try {
      const res = await apiClient.post<VoiceImportResponse>("/api/onboarding/voice-import", {
        customSampleText: overrideText ?? voiceSampleText(),
        websiteUrl: fields.websiteUrl.trim(),
      });
      if (!res?.success) return;
      setLinkedInConnected(true);
      setFields((prev) => ({
        ...prev,
        importedVoiceCount: res.importedCount || 1,
        linkedInProfile: res.profile ?? prev.linkedInProfile,
        aiSuggestions: res.aiSuggestions ?? prev.aiSuggestions,
        postSnippet: res.postSnippet ?? prev.postSnippet,
        ...(res.profile?.company && !prev.businessName.trim()
          ? { businessName: res.profile.company, businessNameFromLinkedIn: true }
          : {}),
      }));
    } catch (err) {
      console.warn("Voice import error:", err);
      // A 409 means the stored LinkedIn token expired and the backend cleared
      // it, so the screen goes back to "Connect" rather than pretending it worked.
      if (err instanceof ApiRequestError && err.status === 409) {
        setLinkedInConnected(false);
        setError(err.message);
      } else {
        setError(toErrorMessage(err, "Couldn't import your LinkedIn voice. Please try again."));
      }
    }
  }

  // The brief takes ~8s and depends only on setup's answers, so it is asked for
  // once the story screen opens and reused at "Write my first post" if nothing changed.
  const briefCache = useRef<{ key: string; brief: Promise<Brief> } | null>(null);

  function setupAnswers() {
    const answers = fieldsWithImport(fields);
    const voiceSample = [answers.selectedVoice || DEFAULT_VOICE, answers.customSampleText.trim()].filter(Boolean).join(" ");
    return { answers, voiceSample };
  }

  function briefFor(answers: WizardFields, voiceSample: string): Promise<Brief> {
    if (answers.directives.length > 0) return Promise.resolve({ directives: answers.directives, positioning: answers.positioningSummary });
    const request = briefRequest(answers, voiceSample);
    const key = JSON.stringify(request);
    if (briefCache.current?.key !== key) {
      const brief = requestBrief(request);
      // A failed early request is asked again at the finish, not reused.
      brief.catch(() => {
        if (briefCache.current?.brief === brief) briefCache.current = null;
      });
      briefCache.current = { key, brief };
    }
    return briefCache.current.brief;
  }

  function prepareBrief() {
    const { answers, voiceSample } = setupAnswers();
    void briefFor(answers, voiceSample).catch(() => {});
  }

  async function writeFirstPost() {
    setError(null);
    const story = fields.storyText.trim();
    setIsGeneratingDirectives(true);
    try {
      // Checked first: once the workspace is saved, setup cannot be re-run.
      await apiClient.post("/api/onboarding/first-post", { validate: true, story, kind: fields.storyKind });
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't use that answer. Please try again."));
      setIsGeneratingDirectives(false);
      return;
    }

    setSaving(true);
    try {
      const { answers, voiceSample } = setupAnswers();
      const brief = await briefFor(answers, voiceSample);
      update({ directives: brief.directives, positioningSummary: brief.positioning });
      // Only text the user wrote is a writing sample; the voice description
      // guides the brief, and saved as a sample it would show in Brand as a post they wrote.
      // The workspace exists by the time the import saves, so a failed import is logged, not fatal: the Brand page can import again.
      const examplesSaved = await saveWorkspace(answers, brief, answers.customSampleText.trim(), () =>
        saveImport(answers, story).catch((err) => console.warn("Imported brand did not save:", err))
      );
      if (examplesSaved !== null) update({ importedVoiceCount: examplesSaved });

      // The workspace exists now; a failed start is recoverable on the first-post screen, which offers a retry.
      await apiClient.post("/api/onboarding/first-post", { story, kind: fields.storyKind }).catch((err) => {
        console.warn("First post start failed; the first-post screen will offer a retry:", err);
      });
      apiClient.post("/api/pipeline/harvest", {}).catch((err) => console.warn("Initial harvest did not start:", err));

      clearDraft(storageKey);
      router.replace("/onboarding/first-post");
    } catch (err) {
      setError(toErrorMessage(err, "Could not finish setting up. Please try again."));
      setSaving(false);
      setIsGeneratingDirectives(false);
    }
  }

  return {
    draftRestored: hasRestoredDraft,
    ...fields,
    setStep: setter("step"),
    setBusinessName: (businessName: string) => update({ businessName, businessNameFromLinkedIn: false }),
    setWebsiteUrl: setter("websiteUrl"),
    setAudienceDescription: setter("audienceDescription"),
    setContentFocus: setter("contentFocus"),
    setWriterExpertise: setter("writerExpertise"),
    setIndustry: setter("industry"),
    setSelectedPresetId: setter("selectedPresetId"),
    applyPreset: (preset: BrandPreset) => update({ selectedPresetId: preset.id, industry: preset.industry }),
    goToBrandInterview: async () => update({ step: 1 }),
    linkedInConnected,
    setLinkedInConnected,
    toggleChannel: (key: string) =>
      setFields((prev) => ({ ...prev, channels: prev.channels.includes(key) ? prev.channels.filter((c) => c !== key) : [...prev.channels, key] })),
    setPublishingMode: setter("publishingMode"),
    setSelectedVoice: setter("selectedVoice"),
    setCustomSampleText: setter("customSampleText"),
    saveManualVoice,
    importLinkedInVoice,
    setMythAnswer: setter("mythAnswer"),
    setDifferentiatorAnswer: setter("differentiatorAnswer"),
    setAvoidAnswer: setter("avoidAnswer"),
    isGeneratingDirectives,
    setDirectives: (next) => setFields((prev) => ({ ...prev, directives: typeof next === "function" ? next(prev.directives) : next })),
    toggleDirective: (index: number) => setFields((prev) => ({ ...prev, directives: prev.directives.filter((_, i) => i !== index) })),
    saving,
    setStoryText: setter("storyText"),
    setStoryKind: setter("storyKind"),
    writeFirstPost,
    prepareBrief,
    setBrandImport: setter("brandImport"),
    toggleProof: (id: string) =>
      setFields((prev) => ({
        ...prev,
        approvedProofs: prev.approvedProofs.includes(id) ? prev.approvedProofs.filter((p) => p !== id) : [...prev.approvedProofs, id],
      })),
    setKeepImportedVoice: setter("keepImportedVoice"),
    error,
    setError,
    goBack: () => {
      setError(null);
      setFields((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }));
    },
  };
}
