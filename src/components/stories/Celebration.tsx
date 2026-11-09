"use client";

import { Check } from "lucide-react";
import { sessionButtons } from "./sessionButtons";
import type { SessionResult } from "./types";

/** The end of a story session: what was saved, and what happens next. */
export default function Celebration({
  saved,
  harvest,
  onDone,
}: {
  saved: number;
  harvest: SessionResult["harvest"];
  onDone: () => void;
}) {
  const next = saved === 0 ? null : harvest?.started ? "New ideas from your stories in about 2 minutes." : "New ideas from your stories by tonight.";
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-32 text-center">
        <span className="story-pop flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Check className="h-10 w-10" strokeWidth={2} />
        </span>
        <h2 className="mt-8 text-[32px] font-semibold tracking-tight text-ink">
          {saved > 0 ? (saved === 1 ? "1 story saved." : `${saved} stories saved.`) : "No stories this time."}
        </h2>
        <p className="mt-3 max-w-sm text-[17px] leading-relaxed text-muted">
          {saved > 0 ? "Every post Minions writes now has something only you could say." : "That is fine. Come back when something happens worth telling."}
        </p>
        {next && <p className="mt-4 max-w-sm text-[15px] text-muted">{next}</p>}
        {saved > 0 && harvest && !harvest.started && <p className="mt-2 max-w-sm text-[13px] text-subtle">{harvest.message}</p>}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
          <button type="button" autoFocus onClick={onDone} className={`${sessionButtons.primary} w-full`}>
            Continue
          </button>
        </div>
      </footer>
    </>
  );
}
