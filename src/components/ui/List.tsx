"use client";

import React from "react";
import { Check, ChevronRight } from "lucide-react";

/**
 * iOS-style grouped list: a grey rounded group of hairline-separated rows,
 * with an optional plain header above and a quiet note below. Use it for
 * settings-like controls inside a card (channels, facts, cover options).
 */
export function GroupedList({
  header,
  footer,
  children,
  className = "",
  role,
  "aria-label": ariaLabel,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  role?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      {header && <div className="flex items-baseline justify-between gap-2 px-4 text-[13px] text-muted">{header}</div>}
      <div role={role} aria-label={ariaLabel} className="overflow-hidden rounded-2xl bg-surface-2 divide-y divide-line">
        {children}
      </div>
      {footer && <p className="px-4 text-[13px] leading-snug text-subtle">{footer}</p>}
    </div>
  );
}

const rowBase = "flex min-h-11 w-full min-w-0 items-center gap-3 px-4 py-2.5 text-left text-[15px] text-ink";

/**
 * One row: label (and an optional second line) on the left, a value or
 * control on the right. With `onClick` the whole row is a button with a ›.
 */
export function ListRow({
  label,
  hint,
  value,
  trailing,
  onClick,
  disabled,
  expanded,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  /** Grey text on the right, e.g. the current choice. */
  value?: React.ReactNode;
  /** A control on the right (a Switch); replaces the chevron. */
  trailing?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** For a row that opens choices below it. */
  expanded?: boolean;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block break-words">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{hint}</span>}
      </span>
      {value != null && <span className="min-w-0 max-w-[55%] shrink truncate text-muted">{value}</span>}
      {trailing}
      {onClick && !trailing && (
        <ChevronRight
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-subtle transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      )}
    </>
  );
  if (!onClick) return <div className={rowBase}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      className={`${rowBase} cursor-pointer hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent`}
    >
      {body}
    </button>
  );
}

/** The on/off switch: brand blue when on (like the app's other switches), grey when off. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-brand" : "bg-line-strong"}`}
    >
      <span
        aria-hidden="true"
        className={`h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

/**
 * One choice in a pick-one list (put the rows in a GroupedList with
 * role="radiogroup"). The chosen one carries a blue check.
 */
export function ChoiceRow({
  label,
  hint,
  selected,
  disabled,
  onSelect,
  title,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      title={title}
      onClick={() => !selected && onSelect()}
      className={`${rowBase} cursor-pointer hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
      <span className={`min-w-0 flex-1 ${disabled && !selected ? "opacity-50" : ""}`}>
        <span className="block break-words">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{hint}</span>}
      </span>
      <Check aria-hidden="true" className={`h-4 w-4 shrink-0 text-brand ${selected ? "" : "invisible"}`} />
    </button>
  );
}
