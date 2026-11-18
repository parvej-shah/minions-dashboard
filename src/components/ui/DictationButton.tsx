"use client";

import { Mic, Square } from "lucide-react";
import { useDictation } from "@/hooks/useDictation";

interface Props {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * One mic button for a text box: tap, talk, tap again. Uses the browser's
 * free speech recognition and is not shown where the browser has none.
 */
export default function DictationButton({ value, onChange, disabled, className = "" }: Props) {
  const { supported, listening, error, toggle } = useDictation(value, onChange);
  if (!supported) return null;

  return (
    <span className={`inline-flex ${className}`}>
      {error && (
        <span role="status" className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-surface px-2 py-1 text-xs text-coral shadow-soft">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled && !listening}
        aria-pressed={listening}
        aria-label={listening ? "Stop talking" : "Talk instead of typing"}
        title={listening ? "Stop talking" : "Talk instead of typing"}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.96] ${
          listening ? "bg-brand text-brand-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
        }`}
      >
        {listening && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-brand/30 motion-reduce:hidden" />}
        {listening ? <Square className="relative h-3.5 w-3.5 fill-current" /> : <Mic className="h-[18px] w-[18px]" />}
      </button>
    </span>
  );
}
