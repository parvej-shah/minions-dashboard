import { useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { BRAND_PRESETS, type BrandPreset } from "@/constants/brandPresets";
import type { GeneratedDirective } from "@/app/api/onboarding/brand-copilot/route";

export const ONBOARDING_STEPS = ["Company", "LinkedIn Voice", "Brand Interview", "Review & Launch"] as const;

export interface OnboardingWizardState {
  step: number;
  setStep: (step: number) => void;
  // Step 1: Company Snapshot
  businessName: string;
  setBusinessName: (val: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (val: string) => void;
  industry: string;
  setIndustry: (val: string) => void;
  selectedPresetId: string | null;
  setSelectedPresetId: (id: string | null) => void;
  applyPreset: (preset: BrandPreset) => void;

  // Step 2: LinkedIn & Channels
  linkedInConnected: boolean;
  setLinkedInConnected: (val: boolean) => void;
  channels: string[];
  toggleChannel: (key: string) => void;
  importedVoiceCount: number;
  importLinkedInVoice: () => Promise<void>;

  // Step 3: Brand Interview (3 Questions)
  mythAnswer: string;
  setMythAnswer: (val: string) => void;
  differentiatorAnswer: string;
  setDifferentiatorAnswer: (val: string) => void;
  avoidAnswer: string;
  setAvoidAnswer: (val: string) => void;
  isGeneratingDirectives: boolean;
  generateDirectives: () => Promise<void>;

  // Step 4: Review Directives & Finalize
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

export function useOnboardingWizard(): OnboardingWizardState {
  const [step, setStep] = useState(0);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("AI & Developer Tools");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("ai_tech_builders");

  // Step 2
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [channels, setChannels] = useState<string[]>(["blog", "linkedin"]);
  const [importedVoiceCount, setImportedVoiceCount] = useState(0);

  // Step 3
  const [mythAnswer, setMythAnswer] = useState("");
  const [differentiatorAnswer, setDifferentiatorAnswer] = useState("");
  const [avoidAnswer, setAvoidAnswer] = useState("");
  const [isGeneratingDirectives, setIsGeneratingDirectives] = useState(false);

  // Step 4
  const [directives, setDirectives] = useState<GeneratedDirective[]>([]);
  const [positioningSummary, setPositioningSummary] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setStep(3); // Proceed to Review step
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
        icp_description: positioningSummary || `${businessName} provides ${industry} solutions.`,
        channels,
        preset_id: selectedPresetId,
      });

      // Save custom directives into DB if any
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

      // Automatically trigger initial harvest run for instant gratification
      try {
        await apiClient.post("/api/pipeline/harvest", {});
      } catch (harvestErr) {
        console.warn("Initial harvest trigger non-fatal:", harvestErr);
      }

      // Redirect to onboarding done
      window.location.href = "/onboarding/done";
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
