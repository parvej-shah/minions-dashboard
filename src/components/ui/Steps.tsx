"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * The frame for a short guided flow (setup, first post): the wordmark, a thin
 * bar in segments with "n of 4", a big left-aligned title with one line under
 * it, and a footer with one quiet link on the left and one blue pill on the right.
 */

export function StepHeader({ step, total }: { step?: number; total?: number }) {
  return (
    <header className="sticky top-0 z-10 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
        <span className="shrink-0 text-[17px] font-semibold tracking-tight sm:min-w-16">Minions</span>
        {step && total ? (
          <>
            <ol
              className="grid min-w-0 flex-1 gap-1.5"
              style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
              aria-label={`Step ${step} of ${total}`}
            >
              {Array.from({ length: total }, (_, i) => (
                <li key={i} className={`h-1 rounded-full transition-colors duration-300 ${i < step ? "bg-brand" : "bg-line"}`} />
              ))}
            </ol>
            <span className="shrink-0 text-right text-[13px] text-subtle tabular-nums sm:min-w-16" aria-hidden="true">
              {step} of {total}
            </span>
          </>
        ) : null}
      </div>
    </header>
  );
}

/** The screen's one title and one line. */
export function StepTitle({ title, line, center }: { title: React.ReactNode; line?: React.ReactNode; center?: boolean }) {
  return (
    <div className={center ? "text-center" : undefined}>
      <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-ink sm:text-[40px]">{title}</h1>
      {line && <p className="mt-3 text-[17px] leading-relaxed text-muted sm:mt-3.5 sm:text-[19px]">{line}</p>}
    </div>
  );
}

/** The page body under the header: one column, room to breathe. */
export function StepBody({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <main className="flex-1">
      <div className={`animate-rise-in mx-auto w-full px-4 pt-6 pb-12 sm:px-6 sm:pt-10 ${narrow ? "max-w-xl" : "max-w-3xl"}`}>{children}</div>
    </main>
  );
}

/** A quiet text action for the footer's left side. */
export function StepLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 text-[15px] text-brand underline-offset-4 hover:underline cursor-pointer">
      {children}
    </button>
  );
}

export function StepFooter({
  label,
  onContinue,
  disabled,
  loading,
  error,
  secondary,
}: {
  label: string;
  onContinue: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  secondary?: React.ReactNode;
}) {
  return (
    <footer className="sticky bottom-0 z-10 border-t border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
        {error && (
          <p key={error} role="alert" className="mb-3 text-[15px] leading-snug text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">{secondary}</div>
          <Button size="lg" loading={loading} disabled={disabled} onClick={onContinue} className="ml-auto whitespace-nowrap">
            {label}
          </Button>
        </div>
      </div>
    </footer>
  );
}

/** Text fields in a guided flow: tall, calm, 17px. */
export const stepInput =
  "w-full rounded-[14px] border border-line-strong bg-surface px-4 py-3.5 text-[17px] leading-relaxed text-ink placeholder:text-subtle " +
  "transition-colors focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

/** A label above a field, with an optional quiet note. */
export function StepLabel({ htmlFor, children, note }: { htmlFor: string; children: React.ReactNode; note?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[15px] font-medium text-ink">
      {children} {note && <span className="font-normal text-subtle">({note})</span>}
    </label>
  );
}

/** A thin bar for work in progress; `value` 0–1, or none for "working". */
export function ThinBar({ value, label }: { value?: number; label: string }) {
  return (
    <div
      className="h-1 w-60 max-w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value === undefined ? undefined : Math.round(value * 100)}
    >
      {value === undefined ? (
        <div className="h-full w-1/3 rounded-full bg-brand animate-[indeterminate_1.4s_ease-in-out_infinite]" />
      ) : (
        <div className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-linear" style={{ width: `${Math.max(value, 0.04) * 100}%` }} />
      )}
    </div>
  );
}

/** Enter continues. Shift+Enter still makes a new line in a textarea. */
export function useEnterToContinue(enabled: boolean, onContinue: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "BUTTON" || target.tagName === "A" || target.tagName === "TEXTAREA")) return;
      event.preventDefault();
      onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onContinue]);
}
