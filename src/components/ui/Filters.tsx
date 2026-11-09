"use client";

import React from "react";
import { segment } from "./segment";

/** A row of plain choices (All | Needs you · 3 | Posted): one is always picked. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className={segment.track}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`min-h-9 cursor-pointer px-4 text-[15px] ${value === o.key ? segment.on : segment.off}`}
        >
          {o.label}
          {o.count ? ` · ${o.count}` : ""}
        </button>
      ))}
    </div>
  );
}

/** The rounded grey search field. */
export function SearchField({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`flex min-h-11 flex-[0_1_260px] items-center gap-2 rounded-full bg-surface-3 px-4 ${className}`}>
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
