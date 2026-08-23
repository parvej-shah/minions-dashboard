import { useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";

export const TONE_FORMALITY_OPTIONS = [
  "technical_direct",
  "tactile_operator",
  "conversational_peer",
] as const;
export type ToneFormality = (typeof TONE_FORMALITY_OPTIONS)[number];

export const ONBOARDING_STEPS = ["Audience", "Channels", "Voice"] as const;

/**
 * All state for the 3-step onboarding wizard, plus the two save points.
 *
 * Save-as-you-go, not batched at the end: step 2 (Channels) posts
 * industry+icp+channels together (matching /api/onboarding/setup's existing
 * payload shape, so the API contract doesn't change), step 3 (Voice) posts
 * separately. Both routes are safe to call more than once (upsert /
 * delete-then-recreate), so Back-and-resubmit never duplicates data -- see
 * /api/onboarding/setup's fix for the ICP_PROFILE/IDENTITY directive rows.
 * Back navigation itself never calls the API; only the next forward "Next"
 * re-saves.
 */
export function useOnboardingWizard() {
  const [step, setStep] = useState(0);

  const [industry, setIndustry] = useState("");
  const [icpDescription, setIcpDescription] = useState("");
  const [channels, setChannels] = useState<string[]>(["blog"]);

  const [formality, setFormality] = useState<ToneFormality>("conversational_peer");
  const [examples, setExamples] = useState(["", "", ""]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });
      setStep(2);
    } catch (err) {
      setError(toErrorMessage(err, "Could not save that step. Try again."));
    } finally {
      setSaving(false);
    }
  }

  async function submitVoice(): Promise<boolean> {
    setError(null);
    const filledExamples = examples.map((e) => e.trim()).filter(Boolean);
    if (filledExamples.length > 0 && filledExamples.length < 3) {
      setError("Paste at least 3 example posts, or leave all of them blank.");
      return false;
    }
    setSaving(true);
    try {
      await apiClient.post("/api/onboarding/voice", {
        tone_questionnaire: { formality },
        examples: filledExamples.length >= 3 ? filledExamples : [],
      });
      return true;
    } catch (err) {
      setError(toErrorMessage(err, "Could not save that step. Try again."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    step,
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
    submitVoice,
  };
}

export type OnboardingWizardState = ReturnType<typeof useOnboardingWizard>;
