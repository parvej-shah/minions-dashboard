"use client";

import React from "react";
import { SkeletonCard, SkeletonGroup } from "./Skeleton";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * The honest alternative to seeding a list with mock rows: say there is
 * nothing here, and why.
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-line bg-surface/40">
      {icon && <div className="mb-3 text-subtle">{icon}</div>}
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description && (
        <p className="text-xs text-muted mt-1.5 max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Loading counterpart to EmptyState, so a page never renders fake rows while
 * fetching: placeholder rows shaped like a list, announced once as `label`.
 */
export function LoadingState({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <SkeletonGroup label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </SkeletonGroup>
  );
}
