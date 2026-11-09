"use client";

import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export interface ToastProps {
  message: string | null;
  variant?: "success" | "error";
  /** Screen position. `bottom` suits page-level confirmations, `top` the shell, `lifted` clears the phone tab bar. */
  position?: "top" | "bottom" | "lifted";
}

const POSITIONS = {
  top: "top-6",
  bottom: "bottom-6",
  lifted: "bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-6",
} as const;

/**
 * The one transient status banner. Renders nothing when there is no message.
 */
export default function Toast({
  message,
  variant = "success",
  position = "bottom",
}: ToastProps) {
  if (!message) return null;

  const tone =
    variant === "error"
      ? "bg-danger/10 border-danger/40 text-danger"
      : "bg-brand/10 border-brand/40 text-brand";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 -translate-x-1/2 z-[60] ${
        POSITIONS[position]
      } flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${tone}`}
    >
      {variant === "error" ? (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
