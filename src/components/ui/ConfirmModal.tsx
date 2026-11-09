"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import Modal from "./Modal";

export type ConfirmVariant = "danger" | "warning" | "primary";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** The confirm button's colour: red only for things that delete, blue otherwise. */
const CONFIRM_BUTTON: Record<ConfirmVariant, string> = {
  danger: "bg-danger text-white hover:bg-danger/90",
  warning: "bg-ink text-white hover:bg-ink/85",
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
};

/** A plain question, one sentence of what happens, Cancel and one clear action. */
export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={!isLoading}
      title={<h3 className="text-[21px] font-semibold leading-snug tracking-tight text-ink">{title}</h3>}
    >
      <div className="space-y-6 p-6 pt-3">
        <p className="text-[15px] leading-relaxed text-muted">{description}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-11 cursor-pointer rounded-full border border-line-strong px-5 text-[15px] font-medium text-ink transition-colors hover:bg-surface-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors disabled:opacity-50 ${CONFIRM_BUTTON[variant]}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
