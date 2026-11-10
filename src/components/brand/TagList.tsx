"use client";

import { useState } from "react";
import type { BrandCategory, BrandDirectiveItem } from "@/types";
import { toErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/fieldStyles";
import { Chip } from "@/components/brand/parts";

const PER_CATEGORY_LIMIT = 6;

/** A short list of brand rules of one kind: pills, with one box to add another. */
export default function TagList({
  category,
  items,
  onAdd,
  onRemove,
  placeholder,
  rows = false,
}: {
  category: BrandCategory;
  items: BrandDirectiveItem[];
  onAdd: (category: BrandCategory, text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  placeholder: string;
  /** Full-width rows instead of pills, for rules that run to a sentence. */
  rows?: boolean;
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
      setError(toErrorMessage(err, "Could not add that. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className={rows ? "flex flex-col items-start gap-2" : "flex flex-wrap gap-2"}>
          {items.map((item) => (
            <Chip key={item.id} onRemove={() => onRemove(item.id)} removeLabel={`Remove ${item.content}`}>
              {item.content}
            </Chip>
          ))}
        </div>
      )}
      {isFull ? (
        <p className="text-sm text-subtle">That&apos;s the most a post can follow ({PER_CATEGORY_LIMIT}). Remove one to add another.</p>
      ) : (
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
            placeholder={placeholder}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <Button variant="secondary" onClick={submit} loading={submitting} disabled={!draft.trim()}>
            Add
          </Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
