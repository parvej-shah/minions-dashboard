"use client";

import React from "react";
import {
  AlertTriangle,
} from "lucide-react";
import { BrandDirectiveItem } from "@/types";
import { LoadingState } from "@/components/ui/EmptyState";
import { isBannedPhrase } from "@/lib/drafts/banned";

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

/** The banned-lexicon list enforced on generated copy -- backed by FORBIDDEN-category
 * BrandDirective rows, the same data the Directives tab and the drafting pipeline use. */
export default function LexiconTab({
  bannedWords,
  isLoading,
  isSubmitting,
  error,
  newBannedWord,
  setNewBannedWord,
  onAddBannedWord,
  onRemoveBannedWord,
}: LexiconTabProps) {
  // FORBIDDEN rows are either words, which drafts are checked against, or
  // whole rules from setup ("Never invent figures ..."), which the writer
  // follows. Listed as one cloud, rules looked like quoted banned words.
  const words = bannedWords.filter((d) => isBannedPhrase(d.content));
  const rules = bannedWords.filter((d) => !isBannedPhrase(d.content));
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger" />
              Words to avoid
            </h3>
            <p className="text-xs text-muted mt-0.5">
              These words are checked in new drafts. Add phrases you never want Minions to use.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="new-banned-word">Word or phrase to avoid</label>
            <input
              id="new-banned-word"
              type="text"
              placeholder="Word or phrase to avoid"
              value={newBannedWord}
              onChange={(e) => setNewBannedWord(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "banned-word-error" : undefined}
              onKeyDown={(e) => e.key === "Enter" && !isSubmitting && newBannedWord.trim() && onAddBannedWord()}
              disabled={isSubmitting}
              className="min-h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink focus:outline-none focus:border-brand sm:w-64"
            />
            <button
              type="button"
              onClick={onAddBannedWord}
              disabled={isSubmitting || !newBannedWord.trim()}
              className="min-h-11 w-full cursor-pointer rounded-xl border border-danger/40 bg-danger/20 px-4 text-sm font-bold text-danger transition-colors hover:bg-danger/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? "Adding…" : "Add word"}
            </button>
          </div>
        </div>

        {error && <p id="banned-word-error" role="alert" className="text-sm text-danger">{error}</p>}

        {/* Tag Cloud */}
        {isLoading ? (
          <LoadingState label="Loading banned lexicon…" />
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {words.length === 0 && <p className="text-xs text-subtle">No banned words yet.</p>}
            {words.map((directive) => (
              <span
                key={directive.id}
                className="inline-flex items-center gap-1.5 bg-danger/10 border border-danger/20 text-danger text-xs font-mono px-3 py-1.5 rounded-xl"
              >
                <span>&quot;{directive.content}&quot;</span>
                <button
                  type="button"
                  onClick={() => onRemoveBannedWord(directive.id)}
                  aria-label={`Remove ${directive.content}`}
                  className="min-h-8 min-w-8 cursor-pointer text-danger hover:text-danger transition-colors ml-1"
                  title="Remove from blacklist"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {!isLoading && rules.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface border border-line space-y-3 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-ink">Things the writer avoids</h3>
            <p className="text-xs text-muted mt-0.5">Rules every draft follows, set up from your answers.</p>
          </div>
          <ul className="space-y-2">
            {rules.map((directive) => (
              <li
                key={directive.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-ink leading-relaxed"
              >
                <span>{directive.content}</span>
                <button
                  type="button"
                  onClick={() => onRemoveBannedWord(directive.id)}
                  className="min-h-9 min-w-9 cursor-pointer text-muted hover:text-ink transition-colors"
                  title="Remove this rule"
                  aria-label="Remove this rule"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
