"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { composeStory, restoreStory, type StoryPick } from "@/lib/onboardingStory";
import { StepLabel, StepTitle, stepInput } from "@/components/ui/Steps";

/** How many things from the profile are offered to post about. */
const PICKS = 2;

export function StoryQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  const { prepareBrief, setStoryText, setStoryKind } = wizard;
  // The brief doesn't depend on the story, so it is written while the user picks one. Once per visit.
  const askedForBrief = useRef(false);
  useEffect(() => {
    if (askedForBrief.current) return;
    askedForBrief.current = true;
    prepareBrief();
  }, [prepareBrief]);

  // Current work first: what someone is doing now makes the liveliest first post.
  const experience = wizard.brandImport?.experience;
  const picks: StoryPick[] = useMemo(
    () =>
      [...(experience ?? [])]
        .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "CURRENT_WORK" ? -1 : 1))
        .slice(0, PICKS)
        .map(({ id, kind, content }) => ({ id, kind, content })),
    [experience]
  );

  const [initial] = useState(() => restoreStory(wizard.storyText, picks));
  const [pickId, setPickId] = useState<string | null>(initial.pickId);
  const [detail, setDetail] = useState(initial.detail);
  const pick = picks.find((p) => p.id === pickId) ?? null;

  // The story the writer gets: the pick plus any detail, or what they wrote.
  // Written from the handlers, since the wizard's setters change every render.
  const write = (nextPick: StoryPick | null, nextDetail: string) => {
    const { storyText, storyKind } = composeStory(nextPick, nextDetail);
    setStoryText(storyText);
    setStoryKind(storyKind);
  };
  const choose = (id: string | null) => {
    setPickId(id);
    write(picks.find((p) => p.id === id) ?? null, detail);
  };
  const type = (text: string) => {
    setDetail(text);
    write(pick, text);
  };
  // A fresh visit starts on the first pick, so the story is set before anything is clicked.
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    if (pick && !wizard.storyText.trim()) write(pick, "");
  });

  const ownWords = !pick;

  return (
    <>
      <StepTitle
        title="What should your first post be about?"
        line={picks.length ? "Pick one from your work, or write your own. Nothing gets invented." : "One thing from your work. Your first post is written from it, in your words."}
      />

      {picks.length > 0 && (
        <div role="radiogroup" aria-label="What to post about" className="mt-9 rounded-[28px] bg-surface px-5 shadow-soft sm:px-6">
          {[...picks, null].map((option) => {
            const id = option?.id ?? null;
            const checked = pickId === id;
            return (
              <label key={id ?? "own"} className="flex items-start gap-3.5 border-b border-line py-4 text-[17px] leading-snug text-ink last:border-b-0 cursor-pointer sm:py-5">
                <input
                  type="radio"
                  name="story-pick"
                  checked={checked}
                  onChange={() => choose(id)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
                />
                <span className="min-w-0 flex-1">{option ? option.content : "Something else"}</span>
              </label>
            );
          })}
        </div>
      )}

      <div className={picks.length ? "mt-8" : "mt-9"}>
        <StepLabel htmlFor="setup-story" note={ownWords ? undefined : "optional"}>
          {ownWords ? "What happened?" : "Add a detail only you know"}
        </StepLabel>
        <textarea
          id="setup-story"
          autoFocus={picks.length === 0}
          rows={4}
          value={detail}
          onChange={(e) => type(e.target.value)}
          placeholder={
            ownWords
              ? "Something you learned, an opinion you hold, or what you're working on now…"
              : "What happened, what surprised you, what you'd tell a friend…"
          }
          maxLength={1000}
          className={`${stepInput} mt-2 resize-none`}
        />
      </div>
    </>
  );
}
