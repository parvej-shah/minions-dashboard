"use client";

import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export interface ToastProps {
  message: string | null;
  variant?: "success" | "error";
  /** Screen position. `bottom` suits page-level confirmations, `top` the shell. */
  position?: "top" | "bottom";
}

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
      ? "bg-red-500/10 border-red-500/40 text-red-300"
      : "bg-[#00C9A7]/10 border-[#00C9A7]/40 text-[#00C9A7]";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 -translate-x-1/2 z-[60] ${
        position === "top" ? "top-6" : "bottom-6"
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
