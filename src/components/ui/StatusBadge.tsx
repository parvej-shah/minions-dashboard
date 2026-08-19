"use client";

import React from "react";
import { assetStatusStyle, ideaStatusStyle } from "@/constants/status";

export interface StatusBadgeProps {
  status: string;
  kind: "asset" | "idea";
  className?: string;
}

/** A status pill whose label and colour come from one shared map. */
export default function StatusBadge({ status, kind, className = "" }: StatusBadgeProps) {
  const style = kind === "asset" ? assetStatusStyle(status) : ideaStatusStyle(status);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
}
