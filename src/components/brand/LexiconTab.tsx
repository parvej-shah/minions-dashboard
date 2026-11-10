"use client";

import React from "react";
import { X } from "lucide-react";
import { BrandDirectiveItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/fieldStyles";
import { isBannedPhrase } from "@/lib/drafts/banned";
import { BrandCard, Chip, brandText } from "@/components/brand/parts";

export interface LexiconTabProps {
  bannedWords: BrandDirectiveItem[];
  isLoading: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  newBannedWord: string;
  setNewBannedWord: (v: string) => void;
  onAddBannedWord: () => void;
  onRemoveBannedWord: (id: string) => void;
}

/** Words checked in every draft: the FORBIDDEN brand rules the drafting pipeline reads. */
export default function LexiconTab({ bannedWords, isLoading, isSubmitting, error, newBannedWord, setNewBannedWord, onAddBannedWord, onRemoveBannedWord }: LexiconTabProps) {
  // FORBIDDEN rows are either words, which drafts are checked against, or
  // whole rules from setup ("Never invent figures ..."), which the writer
  // follows. Listed as one cloud, rules looked like quoted banned words.
  const words = bannedWords.filter((d) => isBannedPhrase(d.content));
  const rules = bannedWords.filter((d) => !isBannedPhrase(d.content));
  return (
    <div className="space-y-6">
      <BrandCard title="Words to avoid" line="Every new draft is checked for these.">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="new-banned-word">Word or phrase to avoid</label>
          <input
            id="new-banned-word"
            type="text"
            placeholder="A word or phrase"
            value={newBannedWord}
            onChange={(e) => setNewBannedWord(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "banned-word-error" : undefined}
            onKeyDown={(e) => e.key === "Enter" && !isSubmitting && newBannedWord.trim() && onAddBannedWord()}
            disabled={isSubmitting}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <Button variant="secondary" onClick={onAddBannedWord} loading={isSubmitting} disabled={!newBannedWord.trim()}>Add</Button>
        </div>
        {error && <p id="banned-word-error" role="alert" className="text-sm text-danger">{error}</p>}
        {isLoading ? (
          <LoadingState label="Loading words…" rows={1} />
        ) : words.length === 0 ? (
          <p className={brandText.note}>None of your own yet. The usual hype words are already avoided.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {words.map((directive) => (
              <Chip key={directive.id} onRemove={() => onRemoveBannedWord(directive.id)} removeLabel={`Remove ${directive.content}`}>
                {directive.content}
              </Chip>
            ))}
          </div>
        )}
      </BrandCard>

      {!isLoading && rules.length > 0 && (
        <BrandCard title="Things the writer avoids" line="Rules every draft follows, set up from your answers.">
          <ul className="space-y-2">
            {rules.map((directive) => (
              <li key={directive.id} className={`${brandText.row} flex items-start justify-between gap-3 py-2 pr-2`}>
                <span className="py-1.5 text-[15px] leading-relaxed text-ink">{directive.content}</span>
                <button type="button" onClick={() => onRemoveBannedWord(directive.id)} className={brandText.iconButton} aria-label="Remove this rule">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </BrandCard>
      )}
    </div>
  );
}
