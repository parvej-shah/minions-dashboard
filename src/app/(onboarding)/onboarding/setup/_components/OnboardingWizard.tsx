"use client";

import { useState } from "react";
import { useOnboardingWizard, type OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { useBrandImport } from "@/hooks/useBrandImport";
import { MEMORY_MIN_CHARS } from "@/constants/contentLanes";
import { ImportDrop, type DroppedProfile } from "@/components/brandImport/ImportDrop";
import { ImportLive } from "@/components/brandImport/ImportLive";
import { ImportReview } from "@/components/brandImport/ImportReview";
import { fieldsWithImport } from "@/lib/onboardingSubmit";
import { SETUP_STEPS, setupStep } from "@/lib/onboardingStory";
import { StepBody, StepFooter, StepHeader, StepLink, StepTitle, useEnterToContinue } from "@/components/ui/Steps";
import { AudienceQuestion, FocusQuestion, MIN_ANSWER } from "./BrandQuestions";
import { StoryQuestion } from "./StoryQuestion";
import { BriefBuilding } from "./BriefBuilding";
import { WizardSkeleton } from "./WizardSkeleton";

/**
 * Setup ends in the user's first post. It starts by reading their LinkedIn
 * PDF and website (decision 2026-10-12): they watch their brand assemble,
 * check it on one screen, then pick something from their work to post about.
 * Every screen has the same shape: a title, one line, one card, one button.
 * "I'd rather type it" keeps the older path: what they want to be known for
 * and who reads them, typed. Everything else starts from a default and is
 * changed later in Brand and Schedule.
 */
type Screen = "import" | "reading" | "review" | "focus" | "audience" | "story";

const IMPORT_ENDPOINT = "/api/onboarding/brand-import";

export default function OnboardingWizard({ userId }: { userId: string }) {
  const wizard = useOnboardingWizard(userId);
  // Wait for the saved draft so a returning user lands on their own screen
  // instead of seeing the first question flash first.
  if (!wizard.draftRestored) return <WizardSkeleton />;
  return <Lesson wizard={wizard} />;
}

function firstScreen(wizard: OnboardingWizardState): Screen {
  if (wizard.brandImport) return "review";
  if (wizard.contentFocus.trim().length < MIN_ANSWER) return "import";
  if (wizard.audienceDescription.trim().length < MIN_ANSWER) return "audience";
  return "story";
}

/**
 * The first post needs a focus and a reader. An import can miss either, or
 * the user can drop it in review, so whatever is still missing is asked
 * before the story rather than failing at "Write my first post".
 */
function nextQuestion(wizard: OnboardingWizardState): Screen {
  const answers = fieldsWithImport(wizard);
  if (answers.contentFocus.trim().length < MIN_ANSWER) return "focus";
  if (answers.audienceDescription.trim().length < MIN_ANSWER) return "audience";
  return "story";
}

function Lesson({ wizard }: { wizard: OnboardingWizardState }) {
  const [screen, setScreen] = useState<Screen>(() => firstScreen(wizard));
  const [profile, setProfile] = useState<DroppedProfile | null>(null);
  const run = useBrandImport(IMPORT_ENDPOINT);

  const focusOk = wizard.contentFocus.trim().length >= MIN_ANSWER;
  const audienceOk = wizard.audienceDescription.trim().length >= MIN_ANSWER;
  const storyOk = wizard.storyText.trim().length >= MEMORY_MIN_CHARS;
  const canRead = Boolean(profile) || wizard.websiteUrl.trim().length > 3;

  const building = wizard.isGeneratingDirectives || wizard.saving;
  const go = (next: Screen) => {
    wizard.setError(null);
    setScreen(next);
  };

  const startReading = () => {
    wizard.setBrandImport(null);
    void run.start({ profileText: profile?.text ?? "", websiteUrl: wizard.websiteUrl.trim() });
    go("reading");
  };

  const typeInstead = () => {
    run.reset();
    wizard.setBrandImport(null);
    go("focus");
  };

  const BACK: Partial<Record<Screen, Screen>> = {
    reading: "import",
    review: "import",
    focus: wizard.brandImport ? "review" : "import",
    audience: wizard.brandImport ? "review" : "focus",
    story: wizard.brandImport ? "review" : "audience",
  };
  const back = () => {
    if (screen === "reading") run.reset();
    go(BACK[screen] ?? "import");
  };
  const backLink = <StepLink onClick={back}>Back</StepLink>;

  let body: React.ReactNode;
  let footer: { label: string; onContinue: () => void; disabled?: boolean; loading?: boolean; error?: string | null; secondary?: React.ReactNode };
  let wide = false;

  switch (screen) {
    case "import":
      body = (
        <>
          <StepTitle
            title="Start with your LinkedIn profile."
            line="We read it and your website, then set up your brand. You check everything before it's saved."
          />
          <div className="mt-9">
            <ImportDrop profile={profile} onProfile={setProfile} websiteUrl={wizard.websiteUrl} onWebsiteUrl={wizard.setWebsiteUrl} />
          </div>
        </>
      );
      footer = {
        label: "Read my profile",
        onContinue: startReading,
        disabled: !canRead,
        secondary: <StepLink onClick={typeInstead}>I&apos;d rather type it</StepLink>,
      };
      break;
    case "reading":
      wide = true;
      body = <ImportLive run={run} hadWebsite={Boolean(wizard.websiteUrl.trim())} />;
      footer =
        run.status === "error"
          ? { label: "Try again", onContinue: startReading, error: run.error, secondary: <StepLink onClick={typeInstead}>Type it instead</StepLink> }
          : {
              label: "Check it over",
              onContinue: () => {
                wizard.setBrandImport(run.result);
                go("review");
              },
              disabled: run.status !== "done",
              secondary: backLink,
            };
      break;
    case "review":
      body = (
        <>
          <StepTitle title="Does this look like you?" line="Click any line to change it. Nothing is saved until you continue." />
          <div className="mt-9">
            {wizard.brandImport && (
              <ImportReview
                result={wizard.brandImport}
                onChange={wizard.setBrandImport}
                approvedProofs={wizard.approvedProofs}
                onToggleProof={wizard.toggleProof}
                keepVoice={wizard.keepImportedVoice}
                onKeepVoice={wizard.setKeepImportedVoice}
                showFocus
              />
            )}
          </div>
        </>
      );
      footer = { label: "Looks right", onContinue: () => go(nextQuestion(wizard)), secondary: <StepLink onClick={() => go("import")}>Read it again</StepLink> };
      break;
    case "focus":
      body = <FocusQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => go(nextQuestion(wizard)), disabled: !focusOk, secondary: backLink };
      break;
    case "audience":
      body = <AudienceQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => go(nextQuestion(wizard)), disabled: !audienceOk, secondary: backLink };
      break;
    default:
      body = <StoryQuestion wizard={wizard} />;
      footer = {
        label: "Write my first post",
        // A draft saved before this check existed can still be missing an answer.
        onContinue: () => (nextQuestion(wizard) === "story" ? void wizard.writeFirstPost() : go(nextQuestion(wizard))),
        disabled: !storyOk,
        secondary: backLink,
      };
  }

  const enterable = !footer.disabled && !building && screen !== "story" && screen !== "review";
  useEnterToContinue(enterable, footer.onContinue);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <StepHeader step={building ? undefined : setupStep(screen)} total={SETUP_STEPS} />
      {building ? (
        <BriefBuilding />
      ) : (
        <>
          {wide ? <main className="flex-1">{body}</main> : <StepBody key={screen}>{body}</StepBody>}
          <StepFooter {...footer} error={footer.error ?? wizard.error} />
        </>
      )}
    </div>
  );
}
