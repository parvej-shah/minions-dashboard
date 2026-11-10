"use client";

import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { StepLabel, StepTitle, stepInput } from "@/components/ui/Steps";
import { useSetupHint } from "@/hooks/useSetupHint";
import { fieldsWithImport } from "@/lib/onboardingSubmit";

/** Enough text to count as an answer to the two required questions. */
export const MIN_ANSWER = 3;

export function FocusQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <>
      <StepTitle title="What do you want to be known for?" line="Every post Minions writes for you starts here." />
      <div className="mt-9">
        <StepLabel htmlFor="setup-focus">Known for</StepLabel>
        <input
          id="setup-focus"
          autoFocus
          type="text"
          value={wizard.contentFocus}
          onChange={(e) => wizard.setContentFocus(e.target.value)}
          placeholder="e.g. Voice AI for real-estate teams"
          className={`${stepInput} mt-2`}
        />
      </div>
    </>
  );
}

export function AudienceQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  // The example follows what they want to be known for.
  const placeholder = useSetupHint("audience", fieldsWithImport(wizard), "e.g. Brokerage owners who lose leads after hours");
  return (
    <>
      <StepTitle title="Who should your posts reach?" line="Be specific. “Owners of 10-person agencies” beats “business people”." />
      <div className="mt-9">
        <StepLabel htmlFor="setup-audience">Who you write for</StepLabel>
        <textarea
          id="setup-audience"
          autoFocus
          rows={3}
          value={wizard.audienceDescription}
          onChange={(e) => wizard.setAudienceDescription(e.target.value)}
          placeholder={placeholder}
          className={`${stepInput} mt-2 resize-none`}
        />
      </div>
    </>
  );
}
