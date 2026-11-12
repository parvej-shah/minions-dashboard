"use client";

import type { PlainNote, PlainNoteTone } from "@/lib/drafts/plainNotes";

const TONE: Record<PlainNoteTone, { dot: string; label: string }> = {
  fix: { dot: "text-coral", label: "Fix" },
  check: { dot: "text-gold", label: "Check" },
  tip: { dot: "text-subtle", label: "Tip" },
};

/**
 * What the draft check found, in plain words, most serious first. With
 * nothing to report it says so, so a clean draft reads as a green light.
 */
export default function DraftChecks({ notes, className = "" }: { notes: PlainNote[]; className?: string }) {
  // Only surface actionable factual or safety checks; filter out subjective style/length tips
  const actionableNotes = notes.filter((n) => n.tone !== "tip");
  if (actionableNotes.length === 0) {
    return <p className={`text-[15px] text-success ${className}`}>✓ Nothing to fix. It only says what you told us.</p>;
  }
  return (
    <section aria-label="Before you post" className={className}>
      <ul className="space-y-2.5">
        {actionableNotes.map((note, i) => {
          const tone = TONE[note.tone];
          return (
            <li key={i} className="flex items-start gap-2.5 text-[15px] leading-snug text-ink">
              <span className={`${tone.dot} leading-snug`} aria-label={tone.label}>●</span>
              <span>{note.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The one-line summary of the checks, for the Details fold. */
export function checksSummary(notes: PlainNote[], unchecked: number): string {
  const serious = notes.filter((n) => n.tone !== "tip").length + unchecked;
  if (serious === 0) return "Details: ready to post";
  return serious === 1 ? "Details: 1 item to review" : `Details: ${serious} items to review`;
}
