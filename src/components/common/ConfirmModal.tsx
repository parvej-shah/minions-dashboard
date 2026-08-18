"use client";

import React, { useEffect } from "react";
import { AlertTriangle, AlertCircle, Trash2, X, Loader2, Info } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-500/10 border-red-500/30 text-red-400",
          icon: <Trash2 className="w-5 h-5" />,
          glow: "from-red-500/10",
          confirmBtn: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: <AlertTriangle className="w-5 h-5" />,
          glow: "from-amber-500/10",
          confirmBtn: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20",
        };
      case "primary":
      default:
        return {
          iconBg: "bg-[#00C9A7]/10 border-[#00C9A7]/30 text-[#00C9A7]",
          icon: <Info className="w-5 h-5" />,
          glow: "from-[#00C9A7]/10",
          confirmBtn: "bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] font-extrabold shadow-lg shadow-[#00C9A7]/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-[#0D1520] border border-[#1F2D3D] rounded-2xl shadow-2xl p-6 space-y-5 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-to-b ${styles.glow} to-transparent blur-2xl pointer-events-none rounded-full`} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-[#64748B] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Description */}
        <p className="text-xs text-[#94A3B8] leading-relaxed pl-0.5">
          {description}
        </p>

        {/* Action Buttons */}
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
    </div>
  );
}
