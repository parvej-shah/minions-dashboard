"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Mic, Square } from "lucide-react";

interface Props {
  listening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Pixel size of the round button. */
  size?: number;
  /** Keep focus in the text field (the shared mic must not close the phone keyboard). */
  keepFocus?: boolean;
}

/**
 * The mic's look, shared by every text field: tinted when idle, live bars and a
 * soft halo while listening, with a stop button beside it (to its left, so a
 * mic pinned to a box's right edge stays put).
 */
export default function DictationMic({
  listening,
  onToggle,
  disabled,
  size = 44,
  keepFocus,
}: Props) {
  const label = listening ? "Stop talking" : "Talk instead of typing";
  const title = listening ? "Stop talking (Alt+D)" : "Talk instead of typing (Alt+D)";
  const focusKeep = keepFocus
    ? {
        onPointerDown: (e: PointerEvent) => e.preventDefault(),
        onMouseDown: (e: MouseEvent) => e.preventDefault(),
        tabIndex: -1,
      }
    : {};
  return (
    <span className="inline-flex items-center gap-1.5">
      {listening && (
        <button
          type="button"
          onClick={onToggle}
          {...focusKeep}
          aria-label="Stop dictation"
          title="Stop dictation (Alt+D)"
          style={{ width: size, height: size }}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface text-coral shadow-soft ring-1 ring-coral/30 hover:bg-coral/10 active:scale-[0.94] cursor-pointer transition-[background-color,transform] duration-200 animate-pop-in"
        >
          <Square
            className="h-[34%] w-[34%]"
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      )}
      <button
        type="button"
        onClick={onToggle}
        {...focusKeep}
        disabled={disabled && !listening}
        aria-pressed={listening}
        aria-label={label}
        title={title}
        style={{ width: size, height: size }}
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform] duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.94] ${
          listening
            ? "bg-brand text-brand-ink shadow-float"
            : "bg-surface text-brand shadow-soft ring-1 ring-brand/25 hover:bg-brand/10 hover:ring-brand/40"
        }`}
      >
        {listening && (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-brand animate-mic-halo"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-brand animate-mic-halo [animation-delay:0.8s]"
            />
          </>
        )}
        {listening ? (
          <span
            aria-hidden="true"
            className="relative flex h-[40%] items-center gap-[3px]"
          >
            {[0, 0.15, 0.3, 0.45].map((d) => (
              <span
                key={d}
                className="h-full w-[3px] origin-center rounded-full bg-current animate-mic-bar"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </span>
        ) : (
          <Mic className="h-[45%] w-[45%]" strokeWidth={2.25} />
        )}
      </button>
    </span>
  );
}
