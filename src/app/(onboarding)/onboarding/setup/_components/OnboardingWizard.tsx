"use client";

import { useState } from "react";
import { useOnboardingWizard, type OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { MEMORY_MIN_CHARS } from "@/constants/contentLanes";
import { LessonFooter, LessonHeader, useEnterToContinue } from "./lesson";
import { AudienceQuestion, FocusQuestion, MIN_ANSWER } from "./BrandQuestions";
import { StoryQuestion, storyPraise } from "./StoryQuestion";
import { BriefBuilding } from "./BriefBuilding";
import { WizardSkeleton } from "./WizardSkeleton";

/**
 * Setup as a three-question lesson that ends in the user's first post:
 * what they want to be known for, who reads them, and one thing from their
 * work. Everything else (experience level, voice, company, publishing mode)
 * starts from a default and is changed later in Brand and Schedule.
 */
const LAST_SCREEN = 2;
// The first post's screen is the real finish line, so setup fills the bar only partway.
const SETUP_SHARE = 0.75;

export default function OnboardingWizard({ userId }: { userId: string }) {
  const wizard = useOnboardingWizard(userId);
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
  const [screen, setScreen] = useState(() => firstUnanswered(wizard));

  const focusOk = wizard.contentFocus.trim().length >= MIN_ANSWER;
  const audienceOk = wizard.audienceDescription.trim().length >= MIN_ANSWER;
  const storyLength = wizard.storyText.trim().length;
  const storyOk = storyLength >= MEMORY_MIN_CHARS;

  const building = wizard.isGeneratingDirectives || wizard.saving;
  const back = () => {
    wizard.setError(null);
    setScreen((s) => Math.max(0, s - 1));
  };

  let body: React.ReactNode;
  let footer: { label: string; onContinue: () => void; disabled?: boolean; praise?: string | null };

  switch (screen) {
    case 0:
      body = <FocusQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => setScreen(1), disabled: !focusOk, praise: focusOk ? "Clear territory. Nice!" : null };
      break;
    case 1:
      body = <AudienceQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => setScreen(2), disabled: !audienceOk, praise: audienceOk ? "Now we know who's listening." : null };
      break;
    default:
      body = <StoryQuestion wizard={wizard} />;
      footer = {
        label: "Write my first post",
        onContinue: () => void wizard.writeFirstPost(),
        disabled: !storyOk,
        praise: storyPraise(storyLength),
      };
  }

  useEnterToContinue(!footer.disabled && !building && screen < LAST_SCREEN, footer.onContinue);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <LessonHeader
        progress={building ? SETUP_SHARE : (screen / (LAST_SCREEN + 1)) * SETUP_SHARE}
        onBack={screen > 0 && !building ? back : undefined}
      />
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
