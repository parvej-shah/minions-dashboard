"use client";

import React from "react";
import {
  AlertTriangle,
} from "lucide-react";

export interface LexiconTabProps {
  bannedWords: string[];
  newBannedWord: string;
  setNewBannedWord: (v: string) => void;
  onAddBannedWord: () => void;
  onRemoveBannedWord: (word: string) => void;
}

/** The banned-lexicon list enforced on generated copy. */
export default function LexiconTab({
  bannedWords,
  newBannedWord,
  setNewBannedWord,
  onAddBannedWord,
  onRemoveBannedWord,
}: LexiconTabProps) {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Banned Lexicon & AI Cliché Blacklist
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              The Lead Editorial Reviewer rejects or auto-edits any draft containing these words.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add banned buzzword..."
              value={newBannedWord}
              onChange={(e) => setNewBannedWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddBannedWord()}
              className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            />
            <button
              onClick={onAddBannedWord}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
            >
              + Ban Word
            </button>
          </div>
        </div>

        {/* Tag Cloud */}
        <div className="flex flex-wrap gap-2 pt-2">
          {bannedWords.map((word) => (
            <span
              key={word}
              className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono px-3 py-1.5 rounded-xl"
            >
              <span>&quot;{word}&quot;</span>
              <button
                onClick={() => onRemoveBannedWord(word)}
                className="text-red-400 hover:text-red-200 transition-colors ml-1"
                title="Remove from blacklist"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
