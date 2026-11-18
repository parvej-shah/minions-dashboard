"use client";

import { useDictation } from "@/hooks/useDictation";
import DictationMic from "./DictationMic";

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
      <DictationMic listening={listening} onToggle={toggle} disabled={disabled} />
    </span>
  );
}
