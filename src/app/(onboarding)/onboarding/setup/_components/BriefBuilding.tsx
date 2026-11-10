"use client";

import { useEffect, useState } from "react";
import { StepTitle, ThinBar } from "@/components/ui/Steps";

const BUILD_STEPS = ["Building your brief", "Saving your brand", "Handing your story to the writer"];

/** Shown while the brief is written and the workspace saved: a thin bar and one line that moves along. */
export function BriefBuilding() {
  const [done, setDone] = useState(0);
  useEffect(() => {
    // Paced to a typical ~20s save; the last line stays until the save actually finishes.
    const timer = window.setInterval(() => setDone((d) => Math.min(d + 1, BUILD_STEPS.length - 1)), 6000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <StepTitle center title="Setting you up." line="About 20 seconds. Your answers become the rules every post follows." />
      <div className="mt-9">
        <ThinBar label="Setting you up" />
      </div>
      <p className="mt-3.5 text-[15px] text-subtle" aria-live="polite">
        {BUILD_STEPS[done]}
      </p>
    </main>
  );
}
