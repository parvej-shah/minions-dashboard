"use client";

import { Sparkles } from "lucide-react";
import Confetti from "@/components/ui/Confetti";
import { chunky } from "./chunky";
import type { SessionResult } from "./types";

export default function Celebration({
  saved,
  streak,
  grew,
  harvest,
  onDone,
}: {
  saved: number;
  streak: number;
  grew: boolean;
  harvest: SessionResult["harvest"];
  onDone: () => void;
}) {
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-32 text-center">
        <div className="relative">
          {saved > 0 && <Confetti burst="big" />}
          <span className="story-pop relative flex h-24 w-24 items-center justify-center rounded-full border-b-8 border-brand-edge bg-brand text-brand-ink">
            <Sparkles className="h-12 w-12" strokeWidth={2.25} />
          </span>
        </div>
        <h2 className="mt-8 text-3xl font-extrabold text-brand">{saved > 0 ? "Session complete!" : "No stories this time"}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          {saved > 0 ? "Every post Minions writes now has something new that only you could say." : "That is fine. Come back when something happens worth telling."}
        </p>

        <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3">
          <StatTile label="Stories" tone="#00C9A7" value={`+${saved}`} />
          <StatTile label="Streak" tone="#FF9F43" value={`${streak} wk`} pop={grew} />
          <StatTile label="Ideas" tone="#60A5FA" value={saved === 0 ? "—" : harvest?.started ? "2 min" : "Tonight"} />
        </div>
        {saved > 0 && harvest && !harvest.started && <p className="mt-4 max-w-sm text-xs text-subtle">{harvest.message}</p>}
      </main>
      <footer className="border-t-2 border-line bg-surface-2">
        <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
          <button type="button" autoFocus onClick={onDone} className={`${chunky.primary} w-full`}>
            Continue
          </button>
        </div>
      </footer>
    </>
  );
}

function StatTile({ label, tone, value, pop }: { label: string; tone: string; value: string; pop?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2" style={{ borderColor: tone }}>
      <div className="py-1 text-[10px] font-extrabold uppercase tracking-widest text-white" style={{ background: tone }}>
        {label}
      </div>
      <div className={`py-3 text-xl font-extrabold ${pop ? "story-pop" : ""}`} style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}