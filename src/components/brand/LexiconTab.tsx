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
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Banned Lexicon & AI Cliché Blacklist
            </h3>
            <p className="text-xs text-muted mt-0.5">
              The Lead Editorial Reviewer rejects or auto-edits any draft containing these words.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add banned buzzword..."
              value={newBannedWord}
              onChange={(e) => setNewBannedWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isSubmitting && newBannedWord.trim() && onAddBannedWord()}
              disabled={isSubmitting}
              className="bg-surface-2 border border-line rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-brand"
            />
            <button
              onClick={onAddBannedWord}
              disabled={isSubmitting || !newBannedWord.trim()}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "+ Ban Word"}
            </button>
          </div>
        </div>

        {/* Tag Cloud */}
        {isLoading ? (
          <LoadingState label="Loading banned lexicon…" />
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {words.length === 0 && <p className="text-xs text-subtle">No banned words yet.</p>}
            {words.map((directive) => (
              <span
                key={directive.id}
                className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono px-3 py-1.5 rounded-xl"
              >
                <span>&quot;{directive.content}&quot;</span>
                <button
                  onClick={() => onRemoveBannedWord(directive.id)}
                  className="text-red-400 hover:text-red-200 transition-colors ml-1"
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
                  onClick={() => onRemoveBannedWord(directive.id)}
                  className="text-muted hover:text-ink transition-colors"
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
