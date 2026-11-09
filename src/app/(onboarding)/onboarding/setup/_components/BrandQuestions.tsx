"use client";

import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { ExampleChip, Question, lessonInput } from "./lesson";

/** Enough text to count as an answer to the two required questions. */
export const MIN_ANSWER = 3;

const FOCUS_EXAMPLES = ["Practical AI for developers", "Growing a B2B SaaS", "Real estate and proptech", "Engineering leadership"];
const AUDIENCE_EXAMPLES = ["Founders of early-stage startups", "Engineering managers", "Operations leaders at B2B companies", "Real estate agents and brokers"];

export function FocusQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <>
      <Question title="What do you want to be known for?" hint="Your territory. Every idea Minions finds for you starts here." />
      <input
        autoFocus
        type="text"
        value={wizard.contentFocus}
        onChange={(e) => wizard.setContentFocus(e.target.value)}
        placeholder="e.g. Practical AI tools and real-world use cases"
        aria-label="What you want to be known for"
        className={`${lessonInput} mt-6`}
      />
      <p className="mt-5 text-sm font-semibold text-muted">Or tap one to start</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {FOCUS_EXAMPLES.map((example) => (
          <ExampleChip key={example} selected={wizard.contentFocus === example} onClick={() => wizard.setContentFocus(example)}>
            {example}
          </ExampleChip>
        ))}
      </div>
    </>
  );
}

export function AudienceQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <>
      <Question title="Who do you want your posts to reach?" hint="Be specific. “CTOs at 50-person startups” beats “tech people”." />
      <textarea
        autoFocus
        rows={3}
        value={wizard.audienceDescription}
        onChange={(e) => wizard.setAudienceDescription(e.target.value)}
        placeholder="e.g. Operations leaders at growing B2B companies who need a clearer way to adopt AI"
        aria-label="Who your posts should reach"
        className={`${lessonInput} mt-6 resize-none`}
      />
      <p className="mt-5 text-sm font-semibold text-muted">Or tap one to start</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {AUDIENCE_EXAMPLES.map((example) => (
          <ExampleChip key={example} selected={wizard.audienceDescription === example} onClick={() => wizard.setAudienceDescription(example)}>
            {example}
          </ExampleChip>
        ))}
      </div>
    </>
  );
}
