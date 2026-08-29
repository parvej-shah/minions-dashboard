import { useState, useEffect } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { BRAND_PRESETS, type BrandPreset } from "@/constants/brandPresets";
import type { GeneratedDirective } from "@/app/api/onboarding/brand-copilot/route";
import type { LinkedInProfile, AiSuggestions } from "@/app/api/onboarding/voice-import/route";

export const ONBOARDING_STEPS = ["Connect LinkedIn", "Company Profile", "Brand Interview", "Review & Launch"] as const;

export interface OnboardingWizardState {
  step: number;
  setStep: (step: number) => void;

  // Step 0: LinkedIn & Channels
  linkedInConnected: boolean;
  setLinkedInConnected: (val: boolean) => void;
  channels: string[];
  toggleChannel: (key: string) => void;
  importedVoiceCount: number;
  linkedInProfile: LinkedInProfile | null;
  postSnippet: string | null;
  aiSuggestions: AiSuggestions | null;
  importLinkedInVoice: () => Promise<void>;

  // Step 1: Company Snapshot
  businessName: string;
  setBusinessName: (val: string) => void;
  businessNameFromLinkedIn: boolean;
  websiteUrl: string;
  setWebsiteUrl: (val: string) => void;
  industry: string;
  setIndustry: (val: string) => void;
  selectedPresetId: string | null;
  setSelectedPresetId: (id: string | null) => void;
  applyPreset: (preset: BrandPreset) => void;

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
  const [step, setStep] = useState(0);

  // Step 1: Company
  const [businessName, setBusinessNameRaw] = useState("");
  const [businessNameFromLinkedIn, setBusinessNameFromLinkedIn] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("AI & Developer Tools");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("ai_tech_builders");

  // Step 0: LinkedIn & Channels (Default: ONLY LinkedIn)
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [channels, setChannels] = useState<string[]>(["linkedin"]);
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusinessName(val: string) {
    setBusinessNameRaw(val);
    setBusinessNameFromLinkedIn(false); // user manually edited — clear flag
  }

  // Restore draft state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessNameRaw(parsed.businessName);
        if (parsed.businessNameFromLinkedIn) setBusinessNameFromLinkedIn(parsed.businessNameFromLinkedIn);
        if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl);
        if (parsed.industry) setIndustry(parsed.industry);
        if (parsed.selectedPresetId) setSelectedPresetId(parsed.selectedPresetId);
        if (parsed.channels && Array.isArray(parsed.channels)) setChannels(parsed.channels);
        if (parsed.mythAnswer) setMythAnswer(parsed.mythAnswer);
        if (parsed.differentiatorAnswer) setDifferentiatorAnswer(parsed.differentiatorAnswer);
        if (parsed.avoidAnswer) setAvoidAnswer(parsed.avoidAnswer);
        if (typeof parsed.step === "number") setStep(parsed.step);
        if (parsed.linkedInProfile) setLinkedInProfile(parsed.linkedInProfile);
        if (parsed.postSnippet) setPostSnippet(parsed.postSnippet);
        if (parsed.aiSuggestions) setAiSuggestions(parsed.aiSuggestions);
        if (parsed.importedVoiceCount) setImportedVoiceCount(parsed.importedVoiceCount);
      }
    } catch (e) {}
  }, []);

  // Save draft state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          businessName,
          businessNameFromLinkedIn,
          websiteUrl,
          industry,
          selectedPresetId,
          channels,
          mythAnswer,
          differentiatorAnswer,
          avoidAnswer,
          step,
          linkedInProfile,
          postSnippet,
          aiSuggestions,
          importedVoiceCount,
        })
      );
    } catch (e) {}
  }, [businessName, businessNameFromLinkedIn, websiteUrl, industry, selectedPresetId, channels, mythAnswer, differentiatorAnswer, avoidAnswer, step, linkedInProfile, postSnippet, aiSuggestions, importedVoiceCount]);

  function applyPreset(preset: BrandPreset) {
    setSelectedPresetId(preset.id);
    setIndustry(preset.industry);
  }

  function toggleChannel(key: string) {
    setChannels((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  async function importLinkedInVoice() {
    setError(null);
    try {
      const res: any = await apiClient.post("/api/onboarding/voice-import", {});
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
      setLinkedInConnected(true);
    }
  }

  async function generateDirectives() {
    setError(null);
    setIsGeneratingDirectives(true);
    try {
      const res: any = await apiClient.post("/api/onboarding/brand-copilot", {
        industry,
        businessName: businessName.trim() || "Our Company",
        websiteUrl: websiteUrl.trim(),
        mythAnswer,
        differentiatorAnswer,
        avoidAnswer,
        selectedPresetId,
      });

      if (res?.directives) {
        setDirectives(res.directives);
        setPositioningSummary(res.positioningSummary || "");
        setStep(3);
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
      await apiClient.post("/api/onboarding/setup", {
        industry: industry.trim() || "General Business",
        icp_description: positioningSummary || `${businessName || "My Brand"} provides ${industry} solutions.`,
        channels,
        preset_id: selectedPresetId,
      });

      if (directives.length > 0) {
        for (const dir of directives) {
          try {
            await apiClient.post("/api/brand/directives", {
              category: dir.category,
              rule_key: dir.rule_key,
              instruction: dir.instruction,
              priority: dir.priority,
              audience_scope: "ALL",
            });
          } catch (e) {
            console.warn("Directive creation non-fatal:", e);
          }
        }
      }

      try {
        await apiClient.post("/api/pipeline/harvest", {});
      } catch (harvestErr) {
        console.warn("Initial harvest trigger non-fatal:", harvestErr);
      }

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      // Redirect directly to dashboard with success toast
      window.location.href = "/?onboarding_success=true";
    } catch (err) {
      setError(toErrorMessage(err, "Could not finalize onboarding. Please try again."));
      setSaving(false);
    }
  }

  return {
    step,
    setStep,
    businessName,
    setBusinessName,
    businessNameFromLinkedIn,
    websiteUrl,
    setWebsiteUrl,
    industry,
    setIndustry,
    selectedPresetId,
    setSelectedPresetId,
    applyPreset,
    linkedInConnected,
    setLinkedInConnected,
    channels,
    toggleChannel,
    importedVoiceCount,
    linkedInProfile,
    postSnippet,
    aiSuggestions,
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
