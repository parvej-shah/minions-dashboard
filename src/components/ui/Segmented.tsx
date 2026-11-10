"use client";

import React from "react";
import { segment } from "./segment";

/**
 * A pick-one switch of two or three short choices (Carousel | Single poster),
 * as a radiogroup: the chosen segment is the white pill.
 */
export default function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={segment.track}>
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
            className={`px-4 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60 ${on ? segment.on : segment.off}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
