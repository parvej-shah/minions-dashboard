"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Rendered in the header when provided; omit for a chrome-less panel. */
  title?: React.ReactNode;
  /** Tailwind max-width class for the panel. */
  maxWidthClass?: string;
  /** Hides the close button, for flows the user must resolve via an action. */
  hideCloseButton?: boolean;
  /** Set false to keep a click on the backdrop from closing the modal. */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}

/**
 * The one modal shell.
 *
 * Five places previously hand-rolled `fixed inset-0` + backdrop + panel, each
 * with its own (or missing) Escape handling and body-scroll locking.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  maxWidthClass = "max-w-md",
  hideCloseButton = false,
  closeOnBackdrop = true,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    // Lock background scroll while the modal is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClass} bg-[#0D1520] border border-[#1F2D3D] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 p-6 pb-0">
            <div className="min-w-0">{title}</div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded-lg text-[#64748B] hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
