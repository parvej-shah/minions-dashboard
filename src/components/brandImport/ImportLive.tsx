"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { BadgeCheck, Briefcase, Check, Globe, Loader2, Mic2, ScanText, Target, UserRound, Users2 } from "lucide-react";
import Confetti from "@/components/ui/Confetti";
import type { BrandImportRun, StepState } from "@/hooks/useBrandImport";
import type { BrandImport, ImportStep } from "@/lib/brandImport/types";

/**
 * The import, live: on one side the lines Minions is reading right now, on
 * the other the brand assembling from what it found. Every card fills when
 * its result actually arrives from the server; nothing here is on a timer
 * pretending to work.
 */

const STEP_LABELS: Record<ImportStep, string> = {
  profile: "Profile",
  website: "Website",
  voice: "Voice",
  audience: "Audience",
  experience: "Experience",
  proof: "Proof",
};
const STEP_ORDER: ImportStep[] = ["profile", "website", "voice", "audience", "experience", "proof"];

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Types text out once, the way it would be written. Shows it whole under reduced motion. */
function TypeOut({ text }: { text: string }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0));
  useEffect(() => {
    if (shown >= text.length) return;
    const timer = window.setTimeout(() => setShown((n) => Math.min(text.length, n + 3)), 16);
    return () => window.clearTimeout(timer);
  }, [shown, text.length]);
  return <span className={shown < text.length ? "import-caret" : undefined}>{text.slice(0, shown)}</span>;
}

/** How much of the brand was found, out of what these sources could give. */
export function importCoverage(result: BrandImport, hadWebsite: boolean) {
  const parts = [
    Boolean(result.identity),
    Boolean(result.focus),
    Boolean(result.icp),
    result.experience.length > 0,
    Boolean(result.voice),
    ...(hadWebsite ? [result.proofs.length > 0] : []),
  ];
  return { found: parts.filter(Boolean).length, total: parts.length };
}

function Ring({ value, done }: { value: number; done: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-line" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className={`transition-[stroke-dashoffset] duration-700 ease-out ${done ? "stroke-gold" : "stroke-brand"}`}
        />
      </svg>
      <span className={`text-sm font-extrabold ${done ? "text-gold" : "text-ink"}`}>{Math.round(value * 100)}%</span>
      {done && <Confetti burst="big" />}
    </span>
  );
}

function StepPill({ label, step }: { label: string; step: StepState }) {
  const tone =
    step.state === "done"
      ? "border-brand/40 bg-brand/10 text-brand"
      : step.state === "active"
        ? "border-brand bg-surface text-ink"
        : step.state === "skipped"
          ? "border-line bg-surface text-subtle line-through decoration-subtle/60"
          : "border-line bg-surface text-subtle";
  return (
    <li className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${tone}`} title={step.detail}>
      {step.state === "done" ? (
        <Check className="h-3.5 w-3.5 animate-pop-in" strokeWidth={3.5} />
      ) : step.state === "active" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={3} />
      ) : null}
      {label}
      {step.state === "done" && step.detail && /\d/.test(step.detail) && <span className="font-bold text-muted">· {step.detail}</span>}
    </li>
  );
}

function BuildCard({ icon, title, ready, waiting, children }: { icon: ReactNode; title: string; ready: boolean; waiting: boolean; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border-2 border-line bg-surface p-4 ${ready ? "import-landed" : ""}`}>
      <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-subtle">
        <span className={ready ? "text-brand" : undefined}>{icon}</span>
        {title}
        {ready && <Check className="ml-auto h-4 w-4 animate-pop-in text-brand" strokeWidth={3} />}
      </h2>
      <div className="mt-3">
        {ready ? (
          <div className="animate-rise-in">{children}</div>
        ) : waiting ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3.5 w-11/12 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-surface-2),var(--color-surface-3),var(--color-surface-2))] bg-[length:200%_100%]" />
            <div className="h-3.5 w-2/3 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-surface-2),var(--color-surface-3),var(--color-surface-2))] bg-[length:200%_100%]" />
          </div>
        ) : (
          <p className="text-sm text-subtle">Nothing to read for this one.</p>
        )}
      </div>
    </section>
  );
}

function Chips({ items, tone = "default" }: { items: string[]; tone?: "default" | "brand" }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <li
          key={item}
          style={{ animationDelay: `${i * 90}ms` }}
          className={`animate-pop-in rounded-lg px-2.5 py-1 text-xs font-bold ${tone === "brand" ? "bg-brand/15 text-brand" : "bg-surface-2 text-ink"}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

const VOICE_WORDS = {
  formality: { casual: "Casual", balanced: "Balanced", formal: "Formal" },
  sentence_length: { short: "Short sentences", mixed: "Mixed sentences", long: "Long sentences" },
  humor: { none: "No jokes", light: "Light humor", frequent: "Playful" },
  emoji_use: { never: "No emoji", sometimes: "Some emoji", often: "Emoji-friendly" },
} as const;

function ReadingFeed({ run, reading }: { run: BrandImportRun; reading: boolean }) {
  const lines = run.feed;
  return (
    <section className="relative overflow-hidden rounded-2xl border-2 border-line bg-surface">
      <h2 className="flex items-center gap-2 border-b-2 border-line px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-subtle">
        <ScanText className="h-4 w-4 text-brand" />
        {reading ? "Reading" : "Read"}
      </h2>
      <ol
        aria-live="polite"
        className="flex h-44 flex-col justify-end gap-2 px-4 py-3 [mask-image:linear-gradient(to_bottom,transparent,black_40%)] md:h-[26rem]"
      >
        {lines.length === 0 && <li className="text-sm text-subtle">Opening your files…</li>}
        {lines.map((line, i) => {
          const latest = i === lines.length - 1;
          return (
            <li key={line.id} className={`animate-rise-in rounded-xl px-3 py-2 text-sm leading-snug transition-colors ${latest && reading ? "bg-brand/10 text-ink" : "text-muted"}`}>
              <span className="mb-0.5 block text-[10px] font-extrabold uppercase tracking-wider text-subtle">{line.from}</span>“{line.text}”
            </li>
          );
        })}
      </ol>
      {reading && <div aria-hidden="true" className="import-scan pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-brand/10 to-transparent" />}
    </section>
  );
}

export function ImportLive({ run, hadWebsite }: { run: BrandImportRun; hadWebsite: boolean }) {
  const { result, steps } = run;
  const reading = run.status === "reading";
  const done = run.status === "done";
  const { found, total } = importCoverage(result, hadWebsite);
  const waiting = (step: ImportStep) => steps[step].state === "active" || steps[step].state === "waiting";
  const name = result.identity?.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4 pb-10 sm:px-6 sm:pt-8">
      <div className="flex items-center gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4 border-line bg-surface">
          <Image src="/icon.svg" alt="" width={36} height={36} className={`h-9 w-9 ${reading ? "animate-pulse" : ""}`} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-balance text-ink sm:text-3xl">
            {done ? (name ? `Here's your brand, ${name}.` : "Here's your brand.") : name ? `Hi ${name}. Building your brand…` : "Building your brand…"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {done ? `${found} of ${total} parts found. Next you check it over.` : "Watch it come together. You'll check everything before it's saved."}
          </p>
        </div>
        <Ring value={total ? found / total : 0} done={done} />
      </div>

      <ol className="mt-5 flex flex-wrap gap-2" aria-label="What Minions is doing">
        {STEP_ORDER.map((step) => (
          <StepPill key={step} label={STEP_LABELS[step]} step={steps[step]} />
        ))}
      </ol>

      <div className="mt-5 grid gap-4 md:grid-cols-[2fr_3fr]">
        <ReadingFeed run={run} reading={reading} />

        <div className="space-y-3">
          <BuildCard icon={<UserRound className="h-4 w-4" />} title="You" ready={Boolean(result.identity)} waiting={waiting("voice")}>
            {result.identity && (
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-brand-ink">
                  {result.identity.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block font-extrabold text-ink">{result.identity.name}</span>
                  <span className="block text-sm text-muted">{result.identity.headline}</span>
                </span>
              </div>
            )}
          </BuildCard>

          <BuildCard icon={<Target className="h-4 w-4" />} title="Known for" ready={Boolean(result.focus)} waiting={waiting("voice")}>
            {result.focus && (
              <>
                <p className="text-base font-bold leading-snug text-ink">
                  <TypeOut text={result.focus.focus} />
                </p>
                {result.focus.topics.length > 0 && (
                  <div className="mt-3">
                    <Chips items={result.focus.topics} tone="brand" />
                  </div>
                )}
              </>
            )}
          </BuildCard>

          <BuildCard icon={<Users2 className="h-4 w-4" />} title="Who you write for" ready={Boolean(result.icp)} waiting={waiting("audience")}>
            {result.icp && (
              <>
                <p className="text-sm leading-snug text-ink">
                  <TypeOut text={result.icp.who || "New things your buyers care about"} />
                </p>
                {result.icp.pains.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-subtle">What keeps them up</p>
                    <Chips items={result.icp.pains.slice(0, 5)} />
                  </div>
                )}
              </>
            )}
          </BuildCard>

          <BuildCard
            icon={<Briefcase className="h-4 w-4" />}
            title={result.experience.length ? `Experience · ${result.experience.length}` : "Experience"}
            ready={result.experience.length > 0}
            waiting={waiting("experience")}
          >
            <ul className="space-y-2">
              {result.experience.map((item, i) => (
                <li
                  key={item.id}
                  style={{ animationDelay: `${i * 160}ms` }}
                  className="animate-rise-in rounded-xl bg-surface-2 px-3 py-2 text-sm leading-snug text-ink"
                >
                  {item.content}
                  <span className="mt-1 block text-[11px] font-bold text-subtle">from {item.from}</span>
                </li>
              ))}
            </ul>
          </BuildCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <BuildCard icon={<Mic2 className="h-4 w-4" />} title="Your voice" ready={Boolean(result.voice)} waiting={waiting("voice")}>
              {result.voice && (
                <Chips
                  items={[
                    VOICE_WORDS.formality[result.voice.questionnaire.formality],
                    VOICE_WORDS.sentence_length[result.voice.questionnaire.sentence_length],
                    VOICE_WORDS.humor[result.voice.questionnaire.humor],
                    VOICE_WORDS.emoji_use[result.voice.questionnaire.emoji_use],
                  ]}
                />
              )}
            </BuildCard>

            <BuildCard
              icon={hadWebsite ? <BadgeCheck className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              title="Proof from your site"
              ready={result.proofs.length > 0}
              waiting={hadWebsite && waiting("proof")}
            >
              <p className="text-sm text-ink">
                <b className="text-2xl font-extrabold text-gold">{result.proofs.length}</b> claim{result.proofs.length === 1 ? "" : "s"} found
              </p>
              <p className="mt-1 text-xs text-muted">You’ll tick the ones that are true before Minions uses them.</p>
            </BuildCard>
          </div>
        </div>
      </div>
    </div>
  );
}
