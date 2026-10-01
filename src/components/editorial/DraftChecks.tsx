"use client";

import { AlertTriangle, Check, Eye, Lightbulb } from "lucide-react";
import type { PlainNote, PlainNoteTone } from "@/lib/drafts/plainNotes";

const TONE: Record<PlainNoteTone, { icon: typeof Eye; dot: string; label: string }> = {
  fix: { icon: AlertTriangle, dot: "bg-coral text-white", label: "Fix" },
  check: { icon: Eye, dot: "bg-gold text-[#1F1300]", label: "Check" },
  tip: { icon: Lightbulb, dot: "bg-surface-2 text-muted", label: "Tip" },
};

/**
 * "Before you post": what the draft check found, in plain words, most
 * serious first. With nothing to report it says so, so a clean draft reads
 * as a green light rather than as an empty box.
 */
export default function DraftChecks({ notes, className = "" }: { notes: PlainNote[]; className?: string }) {
  if (notes.length === 0) {
    return (
      <div className={`flex items-center gap-3 rounded-2xl border-2 border-brand/30 bg-brand/5 p-4 ${className}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink">
          <Check className="h-5 w-5" strokeWidth={3.5} />
        </span>
        <p className="text-sm font-extrabold text-brand">Nothing to fix. It only says what you told us.</p>
      </div>
    );
  }

  const serious = notes.filter((n) => n.tone !== "tip").length;
  return (
    <section aria-label="Before you post" className={`rounded-2xl border-2 border-line bg-surface p-4 ${className}`}>
      <h3 className="text-sm font-extrabold text-ink">
        {serious > 0 ? `Before you post, look at ${serious === 1 ? "one thing" : `${serious} things`}` : "Looks good. A few tips"}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {notes.map((note, i) => {
          const tone = TONE[note.tone];
          const Icon = tone.icon;
          return (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-snug text-[#CBD5E1]">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone.dot}`} aria-label={tone.label}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2.75} />
              </span>
              <span className="pt-0.5">{note.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
