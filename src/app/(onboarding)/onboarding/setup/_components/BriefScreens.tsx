"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Eye, Loader2, ScrollText, Sparkles, Zap } from "lucide-react";
import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_CADENCE } from "@/lib/scheduling";
import { buttonStyles } from "@/components/ui/Button";
import { OptionList, type Option } from "./lesson";
import { voiceTitle } from "./VoiceQuestion";

const BUILD_STEPS = ["Reading your answers", "Finding your angle", "Writing your brief"];

/** Shown while the brand copilot writes the brief: a checklist that ticks along. */
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
      <h1 className="mt-8 text-2xl font-extrabold sm:text-3xl">Building your brief…</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">This takes a few seconds. Your answers are turning into the rules every draft follows.</p>
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

const CONFETTI = [
  { dx: "-120px", dy: "-90px", rot: "220deg", color: "#00C9A7", delay: "0ms" },
  { dx: "110px", dy: "-100px", rot: "-180deg", color: "#F59E0B", delay: "40ms", round: true },
  { dx: "-150px", dy: "10px", rot: "160deg", color: "#FF6B4A", delay: "80ms" },
  { dx: "140px", dy: "20px", rot: "-240deg", color: "#60A5FA", delay: "20ms", round: true },
  { dx: "-60px", dy: "-140px", rot: "300deg", color: "#F59E0B", delay: "60ms" },
  { dx: "70px", dy: "-150px", rot: "-120deg", color: "#00C9A7", delay: "100ms", round: true },
  { dx: "-100px", dy: "90px", rot: "200deg", color: "#60A5FA", delay: "120ms" },
  { dx: "100px", dy: "100px", rot: "-200deg", color: "#FF6B4A", delay: "90ms", round: true },
];

type Mode = "review" | "auto";

const MODE_OPTIONS: Option<Mode>[] = [
  {
    id: "review",
    title: "I review first",
    body: "Every post waits for your OK before it goes out.",
    badge: "Recommended",
    icon: <Eye className="h-6 w-6" strokeWidth={2.25} />,
  },
  {
    id: "auto",
    title: "Publish on schedule",
    body: "Posts go out on their own. You can still edit anything queued.",
    icon: <Zap className="h-6 w-6" strokeWidth={2.25} />,
    tone: "gold",
  },
];

/** The reward screen: the brief is done, pick how posts go live, then go find ideas. */
export function BriefReady({ wizard }: { wizard: OnboardingWizardState }) {
  const { setLinkedInConnected, setPublishingMode } = wizard;
  useEffect(() => {
    apiClient
      .get<{ channels?: Array<{ key: string; has_credential?: boolean }> }>("/api/channels")
      .then((result) => setLinkedInConnected(Boolean(result.channels?.some((channel) => channel.key === "linkedin" && channel.has_credential))))
      .catch(() => undefined);
  }, [setLinkedInConnected]);
  const chooseMode = useCallback((mode: Mode) => setPublishingMode(mode), [setPublishingMode]);

  const postsPerWeek = DEFAULT_CADENCE.daysOfWeek.length * DEFAULT_CADENCE.postsPerDay;
  const stats = [
    { label: "Rules", value: String(wizard.directives.length || "—"), icon: ScrollText, tone: "text-brand" },
    { label: "Voice", value: voiceTitle(wizard.selectedVoice).split(" ")[0], icon: Sparkles, tone: "text-gold" },
    { label: "Posts", value: `${postsPerWeek}/wk`, icon: CalendarDays, tone: "text-[#60A5FA]" },
  ];

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className="relative mt-2">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`story-confetti absolute left-1/2 top-1/2 h-2.5 w-2.5 ${c.round ? "rounded-full" : "rounded-sm"}`}
              style={{ background: c.color, animationDelay: c.delay, ["--dx" as string]: c.dx, ["--dy" as string]: c.dy, ["--rot" as string]: c.rot }}
            />
          ))}
          <span className="story-pop relative flex h-20 w-20 items-center justify-center rounded-full border-b-8 border-gold-edge bg-gold text-[#1F1300] sm:h-24 sm:w-24">
            <ScrollText className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2.25} />
          </span>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-gold">Your brief is ready!</h1>
        {wizard.positioningSummary ? (
          <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">{wizard.positioningSummary}</p>
        ) : (
          <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">Every idea and draft now starts from your audience, your field and your voice.</p>
        )}
      </div>

      <div className="animate-rise-in mt-6 grid grid-cols-3 gap-2.5 [animation-delay:150ms] sm:gap-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border-2 border-line bg-surface px-2 py-3 text-center">
            <Icon className={`mx-auto h-5 w-5 ${tone}`} strokeWidth={2.5} aria-hidden="true" />
            <p className={`mt-1 text-xl font-extrabold ${tone}`}>{value}</p>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-subtle">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-extrabold">How should posts go live?</h2>
      <p className="mt-1 text-sm text-muted">You can switch any time in Schedule.</p>
      <div className="mt-4">
        <OptionList label="Publishing mode" options={MODE_OPTIONS} value={wizard.publishingMode} onChange={chooseMode} />
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0077b5] font-serif text-xl font-bold text-white" aria-hidden="true">
          in
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold">LinkedIn</p>
          <p className="text-sm leading-snug text-muted">
            {wizard.linkedInConnected ? "Connected and ready to publish." : "Optional. Connect now or later from Channels."}
          </p>
        </div>
        {wizard.linkedInConnected ? (
          <span className="animate-pop-in flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink" aria-label="Connected">
            <Check className="h-5 w-5" strokeWidth={3.5} />
          </span>
        ) : (
          <Link
            href="/api/auth/linkedin/connect?return_to=/onboarding/setup"
            prefetch={false}
            className={buttonStyles({ variant: "secondary", size: "sm", className: "shrink-0" })}
          >
            Connect
          </Link>
        )}
      </div>
    </>
  );
}
