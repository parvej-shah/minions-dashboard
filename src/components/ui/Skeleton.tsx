import React from "react";

/**
 * Placeholders shaped like the content that is coming, so the page keeps its
 * layout while data loads instead of flashing zeros or a lone spinner.
 * Decorative: screen readers get one "Loading" status per skeleton group.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-xl bg-[linear-gradient(90deg,#EDEDF0_0%,#F5F5F7_50%,#EDEDF0_100%)] bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

/** Lines of text; the last line is shorter, like a real paragraph. */
export function SkeletonText({ lines = 2, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/** Wraps a group of skeletons with a single accessible loading announcement. */
export function SkeletonGroup({ label = "Loading", className = "", children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A card-shaped placeholder: icon, title and a couple of lines. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-3xl bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.04)] ${className}`}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-3 pt-1">
          <Skeleton className="h-4 w-1/2" />
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

/**
 * A generic page: title, an action card, a row of stat tiles and a list.
 * Used by route-level loading.tsx files, so navigation paints instantly.
 */
export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return (
    <SkeletonGroup label={label} className="mx-auto max-w-7xl space-y-6 pb-16">
      <div className="space-y-2 border-b border-line pb-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <SkeletonCard />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-3xl bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.04)]">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </SkeletonGroup>
  );
}
