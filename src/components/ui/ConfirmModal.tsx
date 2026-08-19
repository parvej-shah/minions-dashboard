"use client";

import React from "react";
import { AlertTriangle, Trash2, Loader2, Info } from "lucide-react";
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

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { iconBg: string; icon: React.ReactNode; glow: string; confirmBtn: string }
> = {
  danger: {
    iconBg: "bg-red-500/10 border-red-500/30 text-red-400",
    icon: <Trash2 className="w-5 h-5" />,
    glow: "from-red-500/10",
    confirmBtn: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20",
  },
  warning: {
    iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    icon: <AlertTriangle className="w-5 h-5" />,
    glow: "from-amber-500/10",
    confirmBtn: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20",
  },
  primary: {
    iconBg: "bg-[#00C9A7]/10 border-[#00C9A7]/30 text-[#00C9A7]",
    icon: <Info className="w-5 h-5" />,
    glow: "from-[#00C9A7]/10",
    confirmBtn:
      "bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] font-extrabold shadow-lg shadow-[#00C9A7]/20",
  },
};

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
  const styles = VARIANT_STYLES[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={!isLoading}
      title={
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}
          >
            {styles.icon}
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        </div>
      }
    >
      {/* Ambient top glow */}
      <div
        className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-to-b ${styles.glow} to-transparent blur-2xl pointer-events-none rounded-full`}
      />

      <div className="p-6 pt-5 space-y-5">
        <p className="text-xs text-[#94A3B8] leading-relaxed pl-0.5">{description}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1F2D3D]/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#161D26] border border-[#1F2D3D] transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 ${styles.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
