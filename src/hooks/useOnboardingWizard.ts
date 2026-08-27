import { useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { BRAND_PRESETS, type BrandPreset } from "@/constants/brandPresets";

export const TONE_FORMALITY_OPTIONS = [
  "technical_direct",
  "tactile_operator",
  "conversational_peer",
] as const;
export type ToneFormality = (typeof TONE_FORMALITY_OPTIONS)[number];

export const ONBOARDING_STEPS = ["Audience", "Channels", "Voice", "Plan"] as const;

/**
 * All state for the 4-step onboarding wizard, plus the two save points.
 */
export function useOnboardingWizard() {
  const [step, setStep] = useState(0);

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [industry, setIndustry] = useState("");
  const [icpDescription, setIcpDescription] = useState("");
  const [channels, setChannels] = useState<string[]>(["blog"]);

  const [formality, setFormality] = useState<ToneFormality>("conversational_peer");
  const [examples, setExamples] = useState(["", "", ""]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(preset: BrandPreset) {
    setSelectedPresetId(preset.id);
    setIndustry(preset.industry);
    setIcpDescription(preset.icpDescription);
    setFormality(preset.toneFormality);
    if (preset.examplePosts && preset.examplePosts.length >= 3) {
      setExamples([preset.examplePosts[0], preset.examplePosts[1], preset.examplePosts[2]]);
    }
  }

  function toggleChannel(key: string) {
    setChannels((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  function updateExample(index: number, value: string) {
    setExamples((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function goNextFromIndustry() {
    setError(null);
    if (!industry.trim() || !icpDescription.trim()) {
      setError("Industry and who-you-write-for are both required.");
      return;
    }
    setStep(1);
  }

  async function goNextFromChannels() {
    setError(null);
    setSaving(true);
    try {
      await apiClient.post("/api/onboarding/setup", {
        industry: industry.trim(),
        icp_description: icpDescription.trim(),
        channels,
        preset_id: selectedPresetId,
      });
      setStep(2);
    } catch (err) {
      setError(toErrorMessage(err, "Could not save that step. Try again."));
    } finally {
      setSaving(false);
    }
  }

  async function goNextFromVoice() {
    setError(null);
    const filledExamples = examples.map((e) => e.trim()).filter(Boolean);
    if (filledExamples.length > 0 && filledExamples.length < 3) {
      setError("Paste at least 3 example posts, or leave all of them blank.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/api/onboarding/voice", {
        tone_questionnaire: { formality },
        examples: filledExamples.length >= 3 ? filledExamples : [],
      });
      setStep(3);
    } catch (err) {
      setError(toErrorMessage(err, "Could not save that step. Try again."));
    } finally {
      setSaving(false);
    }
  }

  return {
    step,
    selectedPresetId,
    setSelectedPresetId,
    applyPreset,
    industry,
    setIndustry,
    icpDescription,
    setIcpDescription,
    channels,
    toggleChannel,
    formality,
    setFormality,
    examples,
    updateExample,
    saving,
    error,
    goBack,
    goNextFromIndustry,
    goNextFromChannels,
    goNextFromVoice,
  };
}

export type OnboardingWizardState = ReturnType<typeof useOnboardingWizard>;
