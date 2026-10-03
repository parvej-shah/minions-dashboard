"use client";

import { Check, Copy, Edit3 } from "lucide-react";

interface Props {
  isEditing: boolean;
  onToggleEdit: () => void;
  onCopy: () => void;
  isCopied: boolean;
  /** The channel colours for the Copy button. */
  copyClass: string;
}

/** The Edit / Preview switch and the Copy button above a channel's post. */
export default function VariantActions({ isEditing, onToggleEdit, onCopy, isCopied, copyClass }: Props) {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
      <button
        type="button"
        onClick={onToggleEdit}
        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 sm:flex-none ${
          isEditing ? "bg-brand/15 text-brand border-brand/40 shadow-xs" : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink border-line"
        }`}
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span className="sm:hidden">{isEditing ? "Preview" : "Edit"}</span>
        <span className="hidden sm:inline">{isEditing ? "Preview" : "Edit post"}</span>
      </button>

      <button
        type="button"
        onClick={onCopy}
        className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl sm:flex-none border text-xs font-semibold transition-all cursor-pointer ${copyClass}`}
      >
        {isCopied ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{isCopied ? "Copied!" : "Copy"}</span>
      </button>
    </div>
  );
}
