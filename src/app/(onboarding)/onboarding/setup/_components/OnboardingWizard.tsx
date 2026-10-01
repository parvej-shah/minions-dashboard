"use client";

import { useState } from "react";
import { useOnboardingWizard, type OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { Button } from "@/components/ui/Button";
import { LessonFooter, LessonHeader, useEnterToContinue } from "./lesson";
import { AudienceQuestion, BusinessQuestion, EXPERTISE_PRAISE, ExpertiseQuestion, FocusQuestion, MIN_ANSWER } from "./BrandQuestions";
import { VoiceQuestion } from "./VoiceQuestion";
import { BriefBuilding, BriefReady } from "./BriefScreens";
import { WizardSkeleton } from "./WizardSkeleton";

/**
 * The brand brief as a lesson: one question per screen. The hook still owns
 * three steps (brand, voice, finish) and all the saving; step 0 is split into
 * four screens here, so screens 0-3 are step 0, screen 4 is step 1 and
 * screen 5 is step 2.
 */
const BRAND_SCREENS = 4;
const LAST_SCREEN = BRAND_SCREENS + 1;

export default function OnboardingWizard() {
  const wizard = useOnboardingWizard();
  // Wait for the saved draft so a returning user lands on their own screen
  // instead of seeing the first question flash first.
  if (!wizard.draftRestored) return <WizardSkeleton />;
  return <Lesson wizard={wizard} />;
}

function firstUnanswered(wizard: OnboardingWizardState) {
  if (wizard.contentFocus.trim().length < MIN_ANSWER) return 0;
  if (wizard.audienceDescription.trim().length < MIN_ANSWER) return 1;
  return 2;
}

function Lesson({ wizard }: { wizard: OnboardingWizardState }) {
  const [brandScreen, setBrandScreen] = useState(() => firstUnanswered(wizard));
  const screen = wizard.step === 0 ? brandScreen : BRAND_SCREENS + wizard.step - 1;

  const focusOk = wizard.contentFocus.trim().length >= MIN_ANSWER;
  const audienceOk = wizard.audienceDescription.trim().length >= MIN_ANSWER;
  const voiceOk = Boolean(wizard.selectedVoice) || wizard.customSampleText.trim().length >= 20;

  const back = () => {
    wizard.setError(null);
    if (wizard.step === 0) setBrandScreen((s) => Math.max(0, s - 1));
    else {
      if (wizard.step === 1) setBrandScreen(BRAND_SCREENS - 1);
      wizard.goBack();
    }
  };

  const building = wizard.isGeneratingDirectives;
  let body: React.ReactNode;
  let footer: { label: string; onContinue: () => void; disabled?: boolean; loading?: boolean; praise?: string | null; secondary?: React.ReactNode };

  switch (screen) {
    case 0:
      body = <FocusQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => setBrandScreen(1), disabled: !focusOk, praise: focusOk ? "Clear territory. Nice!" : null };
      break;
    case 1:
      body = <AudienceQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => setBrandScreen(2), disabled: !audienceOk, praise: audienceOk ? "Now we know who's listening." : null };
      break;
    case 2:
      body = <ExpertiseQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => setBrandScreen(3), praise: EXPERTISE_PRAISE[wizard.writerExpertise] };
      break;
    case 3: {
      const hasAny = Boolean(wizard.websiteUrl.trim() || wizard.businessName.trim() || wizard.selectedPresetId);
      body = <BusinessQuestion wizard={wizard} />;
      footer = {
        label: "Continue",
        onContinue: () => void wizard.goToBrandInterview(),
        disabled: !hasAny,
        secondary: hasAny ? null : (
          <Button variant="ghost" size="lg" shout block className="sm:w-auto" onClick={() => void wizard.goToBrandInterview()}>
            Skip
          </Button>
        ),
        praise: hasAny ? "Got it. Almost there." : null,
      };
      break;
    }
    case 4:
      body = <VoiceQuestion wizard={wizard} />;
      footer = {
        label: "Build my brief",
        onContinue: () => void wizard.generateDirectives(),
        disabled: !voiceOk,
        loading: building,
        praise: voiceOk ? "Love it. That's your starting voice." : null,
      };
      break;
    default:
      body = <BriefReady wizard={wizard} />;
      footer = {
        label: wizard.saving ? "Setting up" : "Find my first ideas",
        onContinue: () => void wizard.finalizeOnboarding(),
        loading: wizard.saving,
      };
  }

  const canContinue = !footer.disabled && !footer.loading && !building;
  useEnterToContinue(canContinue, footer.onContinue);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <LessonHeader progress={screen / LAST_SCREEN} onBack={screen > 0 && !building && !wizard.saving ? back : undefined} />
      {building ? (
        <BriefBuilding />
      ) : (
        <>
          <main className="flex-1">
            <div key={screen} className="story-step-in mx-auto w-full max-w-2xl px-4 pt-4 pb-10 sm:px-6 sm:pt-8">
              {body}
            </div>
          </main>
          <LessonFooter {...footer} error={wizard.error} />
        </>
      )}
    </div>
  );
}
