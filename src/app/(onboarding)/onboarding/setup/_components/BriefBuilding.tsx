"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

const BUILD_STEPS = ["Reading your answers", "Building your brief", "Handing your story to the writer"];

/** Shown while the brief is written and the workspace saved: a checklist that ticks along. */
export function BriefBuilding() {
  const [done, setDone] = useState(0);
  useEffect(() => {
    // The last step stays spinning until the brief actually arrives.
    const timer = window.setInterval(() => setDone((d) => Math.min(d + 1, BUILD_STEPS.length - 1)), 1600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <span className="story-pop relative flex h-24 w-24 items-center justify-center rounded-full border-b-8 border-brand-edge bg-brand text-brand-ink">
        <Sparkles className="h-12 w-12 animate-pulse" strokeWidth={2.25} />
      </span>
      <h1 className="mt-8 text-2xl font-extrabold sm:text-3xl">Setting you up…</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">A few seconds. Your answers become the rules every post follows.</p>
      <ol className="mt-8 w-full max-w-xs space-y-3 text-left" aria-live="polite">
        {BUILD_STEPS.map((label, i) => {
          const state = i < done ? "done" : i === done ? "active" : "todo";
          return (
            <li key={label} className={`flex items-center gap-3 text-base font-bold ${state === "todo" ? "text-subtle" : "text-ink"}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  state === "done" ? "border-brand bg-brand text-brand-ink" : state === "active" ? "border-brand text-brand" : "border-line"
                }`}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4 animate-pop-in" strokeWidth={3.5} />
                ) : state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
                ) : null}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
