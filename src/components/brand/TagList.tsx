"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { BrandCategory, BrandDirectiveItem } from "@/types";
import { toErrorMessage } from "@/lib/api-client";

const PER_CATEGORY_LIMIT = 6;

export default function TagList({
  category,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  category: BrandCategory;
  items: BrandDirectiveItem[];
  onAdd: (category: BrandCategory, text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFull = items.length >= PER_CATEGORY_LIMIT;

  const submit = async () => {
    if (!draft.trim() || isFull) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(category, draft);
      setDraft("");
    } catch (err) {
      setError(toErrorMessage(err, "Could not add that — please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1.5 bg-surface-2 border border-line text-ink text-[11px] px-3 py-1.5 rounded-lg leading-relaxed"
          >
            {item.content}
            <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.content}`} className="min-h-7 min-w-7 cursor-pointer text-subtle hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          aria-label={placeholder}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
          disabled={isFull}
          placeholder={isFull ? `Limit reached (${PER_CATEGORY_LIMIT})` : placeholder}
          className="flex-1 bg-surface-2 border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          aria-label="Add item"
          disabled={submitting || isFull || !draft.trim()}
          className="flex items-center gap-1 bg-surface-2 hover:bg-line border border-line text-muted hover:text-ink text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
