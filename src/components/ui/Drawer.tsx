"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  onClose: () => void;
  /** Names the dialog for assistive tech. */
  closeLabel: string;
  header: React.ReactNode;
  footer: React.ReactNode;
  /** Blocks Escape, the backdrop and the close button while a save is in flight. */
  busy?: boolean;
  children: React.ReactNode;
}

/** A right-hand slide-over for forms: fixed header and footer, scrolling body. */
export default function Drawer({ onClose, closeLabel, header, footer, busy = false, children }: DrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={busy ? undefined : onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={closeLabel}
        className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden border-l border-line bg-surface shadow-float animate-in slide-in-from-right duration-260 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          {header}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={`Close ${closeLabel}`}
            className="min-h-11 min-w-11 rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
          >
            <X className="mx-auto h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">{children}</div>
        <div className="shrink-0 border-t border-line bg-canvas/90 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4">{footer}</div>
      </div>
    </div>
  );
}
