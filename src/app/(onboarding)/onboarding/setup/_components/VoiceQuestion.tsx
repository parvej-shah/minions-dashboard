"use client";

import { useCallback } from "react";
import { BookOpen, Coffee, Megaphone, Zap } from "lucide-react";
import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { OptionList, Question, lessonInput, type Option } from "./lesson";

/**
 * The description is what gets saved as the voice sample (and what older
 * drafts stored), so it doubles as the option id. Don't reword it casually:
 * useOnboardingWizard's LEGACY_VOICE_DESCRIPTIONS matches on it.
 */
export const VOICE_OPTIONS: Option<string>[] = [
  {
    id: "Short paragraphs, clear tradeoffs, and a useful next step. No hype.",
    title: "Direct & practical",
    body: "Short paragraphs, clear tradeoffs, a useful next step. No hype.",
    aside: "Here's the fix. Three steps, no fluff.",
    icon: <Zap className="h-6 w-6" strokeWidth={2.25} />,
  },
  {
    id: "Teach the why before the how, with calm and precise language.",
    title: "Thoughtful & explanatory",
    body: "The why before the how, in calm, precise language.",
    aside: "Before we change the tool, it's worth asking why it broke.",
    icon: <BookOpen className="h-6 w-6" strokeWidth={2.25} />,
  },
  {
    id: "Lead with a strong point of view, then back it up with reasoning.",
    title: "Bold & opinionated",
    body: "A strong point of view first, then the reasoning.",
    aside: "Most teams don't need AI agents. They need better docs.",
    icon: <Megaphone className="h-6 w-6" strokeWidth={2.25} />,
  },
  {
    id: "Write like a smart colleague: clear, human, and approachable.",
    title: "Warm & conversational",
    body: "Like a smart colleague: clear, human, approachable.",
    aside: "Quick story from this week, because it surprised me.",
    icon: <Coffee className="h-6 w-6" strokeWidth={2.25} />,
  },
];

export function voiceTitle(description: string) {
  return VOICE_OPTIONS.find((o) => o.id === description)?.title ?? "Custom";
}

export function VoiceQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  const { setSelectedVoice } = wizard;
  const choose = useCallback((id: string) => setSelectedVoice(id), [setSelectedVoice]);
  return (
    <>
      <Question title="Which one sounds most like you?" hint="Pick the closest. Your drafts start from this and learn as you edit." />
      <div className="mt-6">
        <OptionList label="Writing voice" options={VOICE_OPTIONS} value={wizard.selectedVoice || null} onChange={choose} columns={2} />
      </div>
      <label className="mt-6 block">
        <span className="mb-1.5 block text-sm font-extrabold text-muted">
          Anything else? <span className="font-semibold text-subtle">(optional)</span>
        </span>
        <input
          type="text"
          value={wizard.customSampleText}
          onChange={(e) => wizard.setCustomSampleText(e.target.value)}
          placeholder="e.g. Avoid buzzwords. Be slightly contrarian."
          className={lessonInput}
        />
      </label>
    </>
  );
}
