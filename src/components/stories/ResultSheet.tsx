"use client";

import { Check, Loader2 } from "lucide-react";
import { sessionButtons } from "./sessionButtons";
import NoteCard from "./NoteCard";
import type { Note } from "./types";

export default function ResultSheet({
  praise,
  notes,
  onChange,
  busy,
  blocked,
  disabled,
  onEdit,
  onKeep,
  error,
}: {
  praise: string;
  notes: Note[];
  onChange: (n: Note[]) => void;
  busy: boolean;
  blocked: boolean;
  disabled: boolean;
  onEdit: () => void;
  onKeep: () => void;
  error: string | null;
}) {
  const kept = notes.filter((n) => n.keep).length;
  const set = (i: number, next: Note) => onChange(notes.map((n, j) => (j === i ? next : n)));
  return (
    <section className="story-sheet-up fixed inset-x-0 bottom-0 z-10 max-h-[85vh] overflow-y-auto border-t border-brand/30 bg-success/5">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="story-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink">
            <Check className="h-6 w-6" strokeWidth={3.5} />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-brand">{praise}</h3>
            <p className="text-sm text-success">
              {notes.length === 1 ? "Here is the note Minions made." : `Minions made ${notes.length} notes.`} Fix anything that is not quite right.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {notes.map((n, i) => (
            <NoteCard key={i} note={n} solo={notes.length === 1} onChange={(next) => set(i, next)} />
          ))}
        </div>

        {blocked && <p className="mt-3 text-sm font-semibold text-danger">Remove the private detail flagged above, or keep that note general.</p>}
        {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <button type="button" disabled={busy} onClick={onEdit} className="py-2 text-sm font-semibold text-success hover:text-ink cursor-pointer disabled:opacity-50">
            Edit my answer
          </button>
          <button type="button" disabled={busy || disabled} onClick={onKeep} className={`${sessionButtons.primary} w-full sm:ml-auto sm:w-auto sm:min-w-[11rem]`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : kept > 1 ? `Keep ${kept}` : "Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}