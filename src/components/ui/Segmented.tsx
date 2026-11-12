"use client";

import React from "react";

/**
 * A pick-one switch of two or three short choices (Carousel | Single poster),
 * as a radiogroup with tactile active state, clear contrast, and optional icons.
 */
export default function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { id: T; label: React.ReactNode; icon?: React.ReactNode }[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex w-fit max-w-full items-center gap-1 rounded-xl border border-line/60 bg-surface-2 p-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => !on && onChange(o.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 ${
              on
                ? "border border-line/60 bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-muted hover:bg-surface/50 hover:text-ink"
            }`}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
