"use client";

import React from "react";
import { segment } from "./segment";

/** A row of plain choices (All | Needs you · 3 | Posted): one is always picked. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  equalWidth = false,
  className = "",
}: {
  label: string;
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
  equalWidth?: boolean;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={
        equalWidth
          ? `grid grid-flow-col auto-cols-fr max-w-full rounded-full bg-surface-3 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`
          : `${segment.track} ${className}`
      }
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`min-h-9 cursor-pointer text-[13.5px] sm:text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
            equalWidth
              ? "w-full min-w-[76px] sm:min-w-[96px] px-2 text-center inline-flex items-center justify-center"
              : "px-4"
          } ${value === o.key ? segment.on : segment.off}`}
        >
          {o.label}
          {o.count ? ` · ${o.count}` : ""}
        </button>
      ))}
    </div>
  );
}

/** The rounded grey search field. */
export function SearchField({
  label,
  value,
  onChange,
  className = "flex-[1_1_220px] sm:flex-[0_1_260px]",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex min-h-11 items-center gap-2 rounded-full bg-surface-3 px-4 ${className}`}>
      <span className="sr-only">{label}</span>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-muted">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
      />
    </label>
  );
}
