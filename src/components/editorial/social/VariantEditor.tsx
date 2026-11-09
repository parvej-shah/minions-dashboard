"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight: number;
  charLimit?: number;
  isSaving: boolean;
  onSave: () => void;
  onPreview: () => void;
}

const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** A textarea that grows with its text, and the sticky bar with the counts and the save button. */
export default function VariantEditor({ value, onChange, placeholder, minHeight, charLimit, isSaving, onSave, onPreview }: Props) {
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [value, minHeight]);

  const overLimit = charLimit !== undefined && value.length > charLimit;

  return (
    <div className="space-y-3">
      <textarea
        ref={textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border-2 border-brand/50 bg-canvas p-4 text-[15px] leading-7 text-ink shadow-inner outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
      />

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border-2 border-line bg-surface/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
          <span className={overLimit ? "text-danger font-bold" : undefined}>
            {charLimit !== undefined ? `${value.length}/${charLimit}` : value.length.toLocaleString()} characters
          </span>
          <span>•</span>
          <span>{countWords(value).toLocaleString()} words</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onPreview} className={buttonStyles({ variant: "ghost", size: "md" })}>
            Preview
          </button>
          <Button type="button" onClick={onSave} loading={isSaving} size="md" icon={<Check className="h-4 w-4" />}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
