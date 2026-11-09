"use client";

import { useState } from "react";
import { ClipboardPaste, Loader2, X } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { MEMORY_MIN_CHARS } from "@/constants/contentLanes";
import { buttonStyles } from "@/components/ui/Button";
import type { StoryExtractDTO } from "@/services/storyBank";
import NoteCard from "./NoteCard";
import type { Note, SessionResult } from "./types";

/** Matches PASTE_MAX_CHARS in services/storyBank.ts (a server module). */
const MAX_CHARS = 6000;

/**
 * For a workspace with none of the author's own material yet: paste a few
 * posts or notes they already wrote, keep the notes Minions finds in them, and
 * ideas start from those. Shown until something is saved, then never again.
 */
export default function PasteCard({ onDismiss, onDone }: { onDismiss: () => void; onDone: (r: SessionResult) => void }) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kept = notes?.filter((n) => n.keep) ?? [];
  const blocked = kept.some((n) => n.check?.confidential);

  const find = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiClient.post<StoryExtractDTO>("/api/story-bank", { action: "paste", text });
      if (!res.candidates.length) setError("Minions found nothing specific in that. Paste posts or notes about something you did, saw or learned.");
      else setNotes(res.candidates.map((c) => ({ ...c, keep: true })));
    } catch (e) {
      setError(toErrorMessage(e, "Could not read that. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiClient.post<{ saved: number }>("/api/story-bank", {
        action: "save",
        items: kept.map(({ kind, content, disclosure }) => ({ kind, content, disclosure })),
        sample: text,
      });
      let harvest: SessionResult["harvest"] = null;
      try {
        harvest = await apiClient.post<{ started: boolean; message: string }>("/api/story-bank", { action: "finish" });
      } catch {
        harvest = { started: false, message: "New ideas will come from the nightly run." };
      }
      onDone({ saved: res.saved, harvest });
    } catch (e) {
      setError(toErrorMessage(e, "Could not save that. Try again."));
      setBusy(false);
    }
  };

  return (
    <section className="relative space-y-3 rounded-2xl border border-gold/30 bg-surface px-4 py-3">
      <button type="button" onClick={onDismiss} aria-label="Hide for a week" className="absolute right-2 top-2 rounded-lg p-1 text-subtle hover:text-ink cursor-pointer">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-2 pr-6 text-sm text-ink">
        <ClipboardPaste className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
        <p>
          <span className="font-semibold text-gold">Make your posts sound like you: </span>
          paste 2–3 posts or notes you have written. Old LinkedIn posts, an email to a client, notes from a talk.
        </p>
      </div>

      {notes ? (
        <>
          <p className="text-xs text-muted">Keep the notes that are right. Ideas start from these, and nothing is saved until you do.</p>
          <div className="space-y-2">
            {notes.map((n, i) => (
              <NoteCard key={i} note={n} solo={notes.length === 1} onChange={(next) => setNotes(notes.map((x, j) => (j === i ? next : x)))} />
            ))}
          </div>
          {blocked && <p className="text-xs font-semibold text-danger">Remove the private detail flagged above, or keep that note general.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy || !kept.length || blocked} onClick={() => void save()} className={buttonStyles({ size: "sm" })}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save {kept.length} {kept.length === 1 ? "note" : "notes"}
            </button>
            <button type="button" disabled={busy} onClick={() => setNotes(null)} className="text-xs text-muted hover:text-ink cursor-pointer disabled:opacity-50">
              Edit what I pasted
            </button>
          </div>
        </>
      ) : (
        <>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_CHARS}
            placeholder="Paste your posts or notes here."
            aria-label="Your posts or notes"
            className="w-full resize-y rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none"
          />
          <button type="button" disabled={busy || text.trim().length < MEMORY_MIN_CHARS} onClick={() => void find()} className={buttonStyles({ size: "sm" })}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {busy ? "Reading…" : "Find my stories"}
          </button>
        </>
      )}
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </section>
  );
}
