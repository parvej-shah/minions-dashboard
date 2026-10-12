"use client";

import { Flame, Hammer, Lightbulb } from "lucide-react";
import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import type { StoryKind } from "@/lib/onboardingDraft";
import { MEMORY_MIN_CHARS } from "@/constants/contentLanes";
import { ExampleChip, Question, lessonInput } from "./lesson";

/** Past this, the answer usually has the specifics a strong post needs. */
export const RICH_STORY = 120;

const KINDS: { id: StoryKind; label: string; icon: React.ReactNode; placeholder: string; starters: string[] }[] = [
  {
    id: "LESSON",
    label: "Something I learned",
    icon: <Lightbulb className="h-5 w-5" strokeWidth={2.5} />,
    placeholder: "e.g. We cut our onboarding from 14 steps to 3. Signups didn't move, but activation doubled, because…",
    starters: ["The mistake I see most often is", "Last month we tried", "What surprised me was"],
  },
  {
    id: "OPINION",
    label: "An opinion I hold",
    icon: <Flame className="h-5 w-5" strokeWidth={2.5} />,
    placeholder: "e.g. Most teams don't need an AI strategy. They need one boring workflow that works, because…",
    starters: ["Unpopular opinion:", "Most people in my field get this wrong:", "I stopped believing that"],
  },
  {
    id: "CURRENT_WORK",
    label: "What I'm building",
    icon: <Hammer className="h-5 w-5" strokeWidth={2.5} />,
    placeholder: "e.g. This week I'm rebuilding our pricing page. The hardest part is deciding what to leave out…",
    starters: ["This week I'm working on", "The hardest part right now is", "We just shipped"],
  },
];

/** Footer praise for the answer: any real answer is good, a detailed one is better. */
export function storyPraise(length: number): string | null {
  if (length >= RICH_STORY) return "Specific details make the best posts. Love it!";
  if (length >= MEMORY_MIN_CHARS) return "That's real. Add a detail or two if you can.";
  return null;
}

export function StoryQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  const kind = KINDS.find((k) => k.id === wizard.storyKind) ?? KINDS[0];
  const length = wizard.storyText.trim().length;
  const meter = Math.min(length / RICH_STORY, 1);
  // Current work first: what someone is doing now makes the liveliest first post.
  const picks = [...(wizard.brandImport?.experience ?? [])].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "CURRENT_WORK" ? -1 : 1)).slice(0, 3);

  const addStarter = (starter: string) => {
    const text = wizard.storyText.trim();
    wizard.setStoryText(text ? `${text} ${starter} ` : `${starter} `);
  };

  return (
    <>
      <Question
        title="Tell me one thing from your work."
        hint="Your first post is written from this, in your words. Nothing gets invented."
      />

      {picks.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-subtle">Start from your profile</p>
          <ul className="mt-2.5 space-y-2">
            {picks.map((item) => {
              const picked = wizard.storyText.trim() === item.content;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={picked}
                    onClick={() => {
                      wizard.setStoryText(item.content);
                      wizard.setStoryKind(item.kind);
                    }}
                    className={`w-full rounded-2xl border-2 border-b-4 px-4 py-3 text-left text-sm leading-snug transition-[transform,border-width] duration-75 cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                      picked ? "border-brand border-b-brand-edge bg-brand/10 text-ink" : "border-line bg-surface text-muted hover:border-line-strong hover:bg-surface-2"
                    }`}
                  >
                    {item.content}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-subtle">Then add the detail only you know, or write something new</p>
        </div>
      )}

      <div role="radiogroup" aria-label="What kind of thing" className={`${picks.length ? "mt-3" : "mt-6"} grid grid-cols-3 gap-2`}>
        {KINDS.map((k) => {
          const selected = k.id === wizard.storyKind;
          return (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => wizard.setStoryKind(k.id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 border-b-4 px-2 py-3 text-center text-xs font-extrabold leading-tight transition-[transform,border-width] duration-75 cursor-pointer active:translate-y-0.5 active:border-b-2 sm:text-sm ${
                selected ? "border-brand border-b-brand-edge bg-brand/10 text-brand" : "border-line bg-surface text-muted hover:border-line-strong hover:bg-surface-2"
              }`}
            >
              {k.icon}
              {k.label}
            </button>
          );
        })}
      </div>

      <textarea
        autoFocus={picks.length === 0}
        rows={5}
        value={wizard.storyText}
        onChange={(e) => wizard.setStoryText(e.target.value)}
        placeholder={kind.placeholder}
        aria-label={kind.label}
        maxLength={1000}
        className={`${lessonInput} mt-4 resize-none`}
      />

      {/* How much detail there is: fills toward a "rich" answer, gold once it gets there. */}
      <div className="mt-2.5 flex items-center gap-3" aria-hidden="true">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-300 ${meter >= 1 ? "bg-gold" : "bg-brand"}`}
            style={{ width: `${Math.max(meter * 100, length > 0 ? 4 : 0)}%` }}
          />
        </div>
        <span className={`text-xs font-extrabold ${meter >= 1 ? "text-gold" : "text-subtle"}`}>
          {meter >= 1 ? "Great detail" : length >= MEMORY_MIN_CHARS ? "Good" : "Keep going"}
        </span>
      </div>

      <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-subtle">Stuck? Start with</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {kind.starters.map((starter) => (
          <ExampleChip key={starter} onClick={() => addStarter(starter)}>
            {starter}…
          </ExampleChip>
        ))}
      </div>
    </>
  );
}
