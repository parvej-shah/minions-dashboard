"use client";

import React from "react";
import { Loader2 } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-[#1F2D3D] bg-[#0D1520]/40">
      {icon && <div className="mb-3 text-[#64748B]">{icon}</div>}
      <h3 className="text-sm font-bold text-[#F1F5F9]">{title}</h3>
      {description && (
        <p className="text-xs text-[#94A3B8] mt-1.5 max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Loading counterpart to EmptyState, so a page never renders fake rows while fetching. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-[#1F2D3D] bg-[#0D1520]/40">
      <Loader2 className="w-5 h-5 animate-spin text-[#00C9A7]" />
      <p className="text-xs text-[#94A3B8] mt-3">{label}</p>
    </div>
  );
}
