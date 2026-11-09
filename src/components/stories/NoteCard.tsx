"use client";

import { MEMORY_MAX_CHARS, type MemoryDisclosure } from "@/constants/contentLanes";
import type { Note } from "./types";

export default function NoteCard({ note, solo, onChange }: { note: Note; solo: boolean; onChange: (n: Note) => void }) {
  const issues = note.check?.issues ?? [];
  const setPrivacy = (disclosure: MemoryDisclosure) => onChange({ ...note, disclosure });
  return (
    <div className={`rounded-2xl border bg-surface-2 p-3 transition-opacity ${note.keep ? "border-brand/40" : "border-line opacity-50"}`}>
      <textarea
        value={note.content}
        maxLength={MEMORY_MAX_CHARS}
        rows={3}
        onChange={(e) => onChange({ ...note, content: e.target.value, check: note.check && { ...note.check, confidential: false } })}
        aria-label="Note"
        className="w-full resize-y bg-transparent text-sm leading-relaxed text-ink focus:outline-none"
      />
      {issues.length > 0 && (
        <ul className="mt-1 space-y-1 text-xs text-gold">
          {issues.map((iss, j) => (
            <li key={j}>
              <b>{iss.text}</b>: {iss.reason}
            </li>
          ))}
          {note.check?.generalized && (
            <li>
              <button
                type="button"
                onClick={() => onChange({ ...note, content: note.check!.generalized!, disclosure: "GENERALIZE", check: { ...note.check!, issues: [], confidential: false } })}
                className="font-bold text-brand hover:underline cursor-pointer"
              >
                Use a version without these details
              </button>
            </li>
          )}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-line p-0.5 text-xs font-bold">
          {(
            [
              ["PUBLIC", "Names OK"],
              ["GENERALIZE", "Keep it general"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={note.disclosure === v}
              onClick={() => setPrivacy(v)}
              className={`rounded-lg px-2.5 py-1 cursor-pointer ${note.disclosure === v ? "bg-brand/15 text-brand" : "text-subtle hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {!solo && (
          <button
            type="button"
            aria-pressed={note.keep}
            onClick={() => onChange({ ...note, keep: !note.keep })}
            className="ml-auto text-xs font-semibold text-muted hover:text-ink cursor-pointer"
          >
            {note.keep ? "Drop" : "Keep"}
          </button>
        )}
      </div>
    </div>
  );
}