"use client";

import { Mic } from "lucide-react";

interface Props {
  listening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Pixel size of the round button. */
  size?: number;
  /** Keep focus in the text field (the shared mic must not close the phone keyboard). */
  keepFocus?: boolean;
}

/** The mic's look, shared by every text field: tinted when idle, live bars and a soft halo while listening. */
export default function DictationMic({ listening, onToggle, disabled, size = 44, keepFocus }: Props) {
  const label = listening ? "Stop talking" : "Talk instead of typing";
  return (
    <button
      type="button"
      onClick={onToggle}
      onPointerDown={keepFocus ? (e) => e.preventDefault() : undefined}
      onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
      tabIndex={keepFocus ? -1 : undefined}
      disabled={disabled && !listening}
      aria-pressed={listening}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform] duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.94] ${
        listening
          ? "bg-brand text-brand-ink shadow-float"
          : "bg-surface text-brand shadow-soft ring-1 ring-brand/25 hover:bg-brand/10 hover:ring-brand/40"
      }`}
    >
      {listening && (
        <>
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand animate-mic-halo" />
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand animate-mic-halo [animation-delay:0.8s]" />
        </>
      )}
      {listening ? (
        <span aria-hidden="true" className="relative flex h-[40%] items-center gap-[3px]">
          {[0, 0.15, 0.3, 0.45].map((d) => (
            <span key={d} className="h-full w-[3px] origin-center rounded-full bg-current animate-mic-bar" style={{ animationDelay: `${d}s` }} />
          ))}
        </span>
      ) : (
        <Mic className="h-[45%] w-[45%]" strokeWidth={2.25} />
      )}
    </button>
  );
}
