"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { useOnboardingWizard, type OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { useBrandImport } from "@/hooks/useBrandImport";
import { MEMORY_MIN_CHARS } from "@/constants/contentLanes";
import { ImportDrop, type DroppedProfile } from "@/components/brandImport/ImportDrop";
import { ImportLive } from "@/components/brandImport/ImportLive";
import { ImportReview } from "@/components/brandImport/ImportReview";
import { LessonFooter, LessonHeader, Question, useEnterToContinue } from "./lesson";
import { AudienceQuestion, FocusQuestion, MIN_ANSWER } from "./BrandQuestions";
import { StoryQuestion, storyPraise } from "./StoryQuestion";
import { BriefBuilding } from "./BriefBuilding";
import { WizardSkeleton } from "./WizardSkeleton";

/**
 * Setup ends in the user's first post. It starts by reading their LinkedIn
 * PDF and website (decision 2026-10-12): they watch their brand assemble,
 * check it on one screen, then pick something from their work to post about.
 * "I'd rather type it" keeps the older path: what they want to be known for
 * and who reads them, typed. Everything else starts from a default and is
 * changed later in Brand and Schedule.
 */
type Screen = "import" | "reading" | "review" | "focus" | "audience" | "story";

// The first post's screen is the real finish line, so setup fills the bar only partway.
const SETUP_SHARE = 0.75;
const PROGRESS: Record<Screen, number> = { import: 0, reading: 1, review: 2, focus: 1, audience: 2, story: 3 };
const SCREENS = 4;
const IMPORT_ENDPOINT = "/api/onboarding/brand-import";
// The whole setup, from saving the LinkedIn PDF to the first published post.
const TUTORIAL_URL = "https://youtu.be/V1yrBqnExAE";

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

function Lesson({ wizard }: { wizard: OnboardingWizardState }) {
  const [screen, setScreen] = useState<Screen>(() => firstScreen(wizard));
  const [profile, setProfile] = useState<DroppedProfile | null>(null);
  const run = useBrandImport(IMPORT_ENDPOINT);

  const focusOk = wizard.contentFocus.trim().length >= MIN_ANSWER;
  const audienceOk = wizard.audienceDescription.trim().length >= MIN_ANSWER;
  const storyLength = wizard.storyText.trim().length;
  const storyOk = storyLength >= MEMORY_MIN_CHARS;
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
    focus: "import",
    audience: "focus",
    story: wizard.brandImport ? "review" : "audience",
  };
  const back = () => {
    if (screen === "reading") run.reset();
    go(BACK[screen] ?? "import");
  };

  const secondaryLink = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="text-sm font-bold text-muted underline-offset-4 hover:text-ink hover:underline cursor-pointer">
      {label}
    </button>
  );

  let body: React.ReactNode;
  let footer: { label: string; onContinue: () => void; disabled?: boolean; loading?: boolean; praise?: string | null; error?: string | null; secondary?: React.ReactNode };
  let wide = false;

  switch (screen) {
    case "import":
      body = (
        <>
          <Question
            title="Let's skip the forms. Show me your LinkedIn."
            hint="Minions reads your profile and website and sets up your brand while you watch. You check it before anything is saved."
          />
          <div className="mt-6">
            <ImportDrop profile={profile} onProfile={setProfile} websiteUrl={wizard.websiteUrl} onWebsiteUrl={wizard.setWebsiteUrl} />
          </div>
          <a
            href={TUTORIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            <PlayCircle className="h-4 w-4 text-brand" />
            Not sure what to do? Watch the 3-minute walkthrough
          </a>
        </>
      );
      footer = {
        label: "Read my profile",
        onContinue: startReading,
        disabled: !canRead,
        praise: profile ? "Got it. This takes about 20 seconds." : null,
        secondary: secondaryLink("I'd rather type it", typeInstead),
      };
      break;
    case "reading":
      wide = true;
      body = <ImportLive run={run} hadWebsite={Boolean(wizard.websiteUrl.trim())} />;
      footer =
        run.status === "error"
          ? { label: "Try again", onContinue: startReading, error: run.error, secondary: secondaryLink("Type it instead", typeInstead) }
          : {
              label: run.status === "done" ? "Check it over" : "Reading…",
              onContinue: () => {
                wizard.setBrandImport(run.result);
                go("review");
              },
              disabled: run.status !== "done",
              loading: run.status === "reading",
              praise: run.status === "done" ? "That's you. No typing needed." : null,
            };
      break;
    case "review":
      body = (
        <>
          <Question title="Here's what I found. Look right?" hint="Tap the pencil to fix anything, × to drop it. Nothing is saved until you continue." />
          <div className="mt-6">
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
      footer = { label: "Looks right", onContinue: () => go("story"), secondary: secondaryLink("Read it again", () => go("import")) };
      break;
    case "focus":
      body = <FocusQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => go("audience"), disabled: !focusOk, praise: focusOk ? "Clear territory. Nice!" : null };
      break;
    case "audience":
      body = <AudienceQuestion wizard={wizard} />;
      footer = { label: "Continue", onContinue: () => go("story"), disabled: !audienceOk, praise: audienceOk ? "Now we know who's listening." : null };
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

  const enterable = !footer.disabled && !building && screen !== "story" && screen !== "review";
  useEnterToContinue(enterable, footer.onContinue);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <LessonHeader progress={building ? SETUP_SHARE : (PROGRESS[screen] / SCREENS) * SETUP_SHARE} onBack={screen !== "import" && !building ? back : undefined} />
      {building ? (
        <BriefBuilding />
      ) : (
        <>
          <main className="flex-1">
            {wide ? (
              body
            ) : (
              <div key={screen} className="story-step-in mx-auto w-full max-w-2xl px-4 pt-4 pb-10 sm:px-6 sm:pt-8">
                {body}
              </div>
            )}
          </main>
          <LessonFooter {...footer} error={footer.error ?? wizard.error} />
        </>
      )}
    </div>
  );
}
