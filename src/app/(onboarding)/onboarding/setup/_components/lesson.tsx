"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

/**
 * Lesson-screen building blocks for the setup wizard: one question per
 * screen, a thick progress bar on top, and a sticky footer that holds the
 * single CONTINUE action and the feedback for the current answer.
 */

export function LessonHeader({ progress, onBack }: { progress: number; onBack?: () => void }) {
  return (
    <header className="sticky top-0 z-10 bg-canvas">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-4 pb-3 sm:gap-4 sm:px-6 sm:pt-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Previous question"
            className="-ml-1 rounded-xl p-1.5 text-subtle transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
        ) : (
          <span className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden="true">
            <Image src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
          </span>
        )}
        <ProgressBar value={Math.max(progress, 0.04)} label="Setup progress" tone={progress >= 1 ? "gold" : "brand"} className="flex-1" />
      </div>
    </header>
  );
}

/** The mascot asking the question in a speech bubble, then an optional hint underneath. */
export function Question({ title, hint }: { title: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="animate-pop-in flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4 border-line bg-surface sm:h-16 sm:w-16">
          <Image src="/icon.svg" alt="" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" />
        </span>
        <div className="relative mb-1 flex-1 rounded-2xl border-2 border-line bg-surface px-4 py-3">
          {/* Bubble tail pointing at the mascot */}
          <span
            aria-hidden="true"
            className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-surface"
          />
          <h1 className="relative text-lg font-extrabold leading-snug text-balance text-ink sm:text-2xl">{title}</h1>
        </div>
      </div>
      {hint && <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{hint}</p>}
    </div>
  );
}

export const lessonInput =
  "w-full rounded-2xl border-2 border-line bg-surface px-4 py-3.5 text-base leading-relaxed text-ink placeholder:text-[#3B4A5E] " +
  "transition-colors focus:border-brand focus:outline-none sm:text-lg";

/** A tap-to-fill example, like a word bank tile. */
export function ExampleChip({ children, selected, onClick }: { children: React.ReactNode; selected?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border-2 border-b-4 px-3 py-2 text-sm font-bold transition-[transform,border-width] duration-75 cursor-pointer active:translate-y-0.5 active:border-b-2 ${
        selected ? "border-brand border-b-brand-edge bg-brand/10 text-brand" : "border-line bg-surface text-[#CBD5E1] hover:border-line-strong hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

export interface Option<T extends string> {
  id: T;
  title: string;
  body: string;
  icon: React.ReactNode;
  /** Small extra line, e.g. a sample sentence in this voice. */
  aside?: string;
  badge?: string;
  tone?: "brand" | "gold";
}

/**
 * Big tappable answer cards with number keys (1, 2, 3…) like a lesson's
 * multiple choice. Only one list per screen, so the keys are unambiguous.
 */
export function OptionList<T extends string>({
  options,
  value,
  onChange,
  columns = 1,
  label,
}: {
  options: Option<T>[];
  value: T | null;
  onChange: (id: T) => void;
  columns?: 1 | 2;
  label: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < options.length) onChange(options[index].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, onChange]);

  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((option, i) => {
        const selected = value === option.id;
        const gold = option.tone === "gold";
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={`group relative flex items-start gap-3 rounded-2xl border-2 border-b-4 p-4 text-left transition-[transform,border-width,background-color,border-color] duration-75 cursor-pointer active:translate-y-0.5 active:border-b-2 ${
              selected
                ? gold
                  ? "border-gold border-b-gold-edge bg-gold/10"
                  : "border-brand border-b-brand-edge bg-brand/10"
                : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
            }`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                selected ? (gold ? "bg-gold text-[#1F1300]" : "bg-brand text-brand-ink") : "bg-surface-2 text-muted"
              }`}
            >
              {option.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={`text-base font-extrabold ${selected ? (gold ? "text-gold" : "text-brand") : "text-ink"}`}>{option.title}</span>
                {option.badge && (
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-brand">{option.badge}</span>
                )}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">{option.body}</span>
              {option.aside && <span className="mt-2 block text-sm italic leading-snug text-subtle">“{option.aside}”</span>}
            </span>
            <span
              aria-hidden="true"
              className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-extrabold sm:flex ${
                selected ? (gold ? "border-gold text-gold" : "border-brand text-brand") : "border-line text-subtle"
              }`}
            >
              {selected ? <Check className="h-4 w-4 animate-pop-in" strokeWidth={3} /> : i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The sticky lesson footer. With `praise` it turns into the green "nice"
 * banner; with `error` it turns red and shakes. `secondary` is the left slot
 * (Skip, or a back link) when there is no feedback to show.
 */
export function LessonFooter({
  label,
  onContinue,
  disabled,
  loading,
  praise,
  error,
  secondary,
}: {
  label: string;
  onContinue: () => void;
  disabled?: boolean;
  loading?: boolean;
  praise?: string | null;
  error?: string | null;
  secondary?: React.ReactNode;
}) {
  const tone = error ? "border-danger/40 bg-[#1F1113]" : praise ? "border-brand/30 bg-[#0C1D1B]" : "border-line bg-canvas";
  return (
    <footer className={`sticky bottom-0 z-10 border-t-2 transition-colors duration-200 ${tone}`}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="min-h-0 sm:min-h-11 sm:flex sm:items-center" aria-live="polite">
          {error ? (
            <p key={error} role="alert" className="story-shake flex items-start gap-2.5 text-sm font-bold text-red-300">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                <AlertCircle className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="pt-1.5">{error}</span>
            </p>
          ) : praise ? (
            <p key={praise} className="flex items-center gap-2.5 text-base font-extrabold text-brand">
              <span className="animate-pop-in flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink">
                <Check className="h-5 w-5" strokeWidth={3.5} />
              </span>
              {praise}
            </p>
          ) : (
            secondary
          )}
        </div>
        <Button
          size="lg"
          shout
          block
          loading={loading}
          disabled={disabled}
          onClick={onContinue}
          className="sm:w-auto sm:min-w-48"
        >
          {label}
        </Button>
      </div>
    </footer>
  );
}

/** Enter continues, as it does in a lesson. Shift+Enter still makes a new line in a textarea. */
export function useEnterToContinue(enabled: boolean, onContinue: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "BUTTON" || target.tagName === "A")) return;
      event.preventDefault();
      onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onContinue]);
}
