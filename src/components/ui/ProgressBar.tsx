import React from "react";

/**
 * The lesson-style progress bar: thick, fully rounded, with a highlight strip
 * across the fill. `value` is 0..1.
 */
export function ProgressBar({
  value,
  label,
  tone = "brand",
  className = "",
}: {
  value: number;
  /** Accessible name, e.g. "Setup progress". */
  label: string;
  tone?: "brand" | "gold";
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`h-4 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      <div
        className={`relative h-full rounded-full transition-[width] duration-500 ease-out ${tone === "gold" ? "bg-gold" : "bg-brand"}`}
        style={{ width: `${pct}%` }}
      >
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
