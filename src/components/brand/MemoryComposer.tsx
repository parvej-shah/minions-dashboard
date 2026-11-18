"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import {
  MEMORY_DISCLOSURE_META,
  MEMORY_KIND_META,
  MEMORY_KINDS,
  MEMORY_MAX_CHARS,
  MEMORY_MIN_CHARS,
  type MemoryDisclosure,
  type MemoryKind,
} from "@/constants/contentLanes";
import type { MemoryCheckResult, MemoryItem } from "@/types";
import { Button } from "@/components/ui/Button";
import ErrorLine from "@/components/ui/ErrorLine";
import DictationButton from "@/components/ui/DictationButton";
import { inputClass } from "@/components/ui/fieldStyles";

export interface MemoryDraft {
  id: string | null;
  kind: MemoryKind;
  content: string;
  disclosure: MemoryDisclosure;
}

export const EMPTY_DRAFT: MemoryDraft = { id: null, kind: "LESSON", content: "", disclosure: "PUBLIC" };

export default function Composer({
  draft,
  setDraft,
  onSaved,
  simple = false,
}: {
  draft: MemoryDraft;
  setDraft: (d: MemoryDraft) => void;
  onSaved: (item: MemoryItem) => void;
  /** Just the box and Add. What's typed counts as a lesson, as in setup, so nobody has to classify their own story. */
  simple?: boolean;
}) {
  const [check, setCheck] = useState<MemoryCheckResult | null>(null);
  const [busy, setBusy] = useState<"checking" | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const length = draft.content.trim().length;
  const valid = length >= MEMORY_MIN_CHARS && length <= MEMORY_MAX_CHARS;

  function update(next: Partial<MemoryDraft>) {
    setDraft({ ...draft, ...next });
    setCheck(null);
  }

  async function persist(content: string) {
    setBusy("saving");
    setError(null);
    try {
      const body = { kind: draft.kind, content, disclosure: draft.disclosure };
      const item = draft.id
        ? await apiClient.patch<MemoryItem>(`/api/brand/memory/${draft.id}`, body)
        : await apiClient.post<MemoryItem>("/api/brand/memory", body);
      setCheck(null);
      onSaved(item);
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't save that."));
    } finally {
      setBusy(null);
    }
  }

  async function checkThenSave() {
    if (!valid) return;
    setBusy("checking");
    setError(null);
    try {
      const result = await apiClient.post<MemoryCheckResult>("/api/brand/memory/check", {
        content: draft.content,
        disclosure: draft.disclosure,
      });
      if (result.issues.length === 0 && !result.confidential) {
        await persist(draft.content);
        return;
      }
      setCheck(result);
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't check that text."));
    } finally {
      setBusy((b) => (b === "checking" ? null : b));
    }
  }

  const adding = !draft.id;
  return (
    <div className="space-y-3">
      {!simple && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[220px_1fr]">
          <select value={draft.kind} onChange={(e) => update({ kind: e.target.value as MemoryKind })} aria-label="Kind of experience" className={`${inputClass} cursor-pointer`}>
            {MEMORY_KINDS.map((k) => (
              <option key={k} value={k}>
                {MEMORY_KIND_META[k].label}
              </option>
            ))}
          </select>
          <p className="self-center text-sm text-subtle">{MEMORY_KIND_META[draft.kind].hint}</p>
        </div>
      )}

      <div className="relative">
        <textarea
          rows={simple ? 2 : 3}
          value={draft.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder={simple ? "Something you built, learned or saw at work…" : "Be specific: what happened, what you did, what changed."}
          aria-label="Experience"
          className={`${inputClass} resize-y pr-14 text-[17px]`}
        />
        <DictationButton value={draft.content} onChange={(content) => update({ content })} disabled={busy !== null} className="absolute bottom-1.5 right-1.5" />
      </div>

      {(!simple || length > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {!simple && (
            <label className="flex cursor-pointer items-center gap-2 text-[15px] text-ink" title={MEMORY_DISCLOSURE_META.GENERALIZE.hint}>
              <input
                type="checkbox"
                checked={draft.disclosure === "GENERALIZE"}
                onChange={(e) => update({ disclosure: (e.target.checked ? "GENERALIZE" : "PUBLIC") satisfies MemoryDisclosure })}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Keep names, places and figures out of posts
            </label>
          )}
          <span className="flex-1" />
          {length > MEMORY_MAX_CHARS && <span className="text-sm text-danger">{length}/{MEMORY_MAX_CHARS}</span>}
          {!adding && (
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(EMPTY_DRAFT);
                setCheck(null);
              }}
            >
              Cancel
            </Button>
          )}
          <Button variant={simple ? "secondary" : "primary"} onClick={checkThenSave} loading={busy !== null} disabled={!valid || check !== null}>
            {busy === "checking" ? "Checking…" : adding ? "Add" : "Save"}
          </Button>
        </div>
      )}

      {length > 0 && length < MEMORY_MIN_CHARS && <p className="text-sm text-subtle">A little more detail: at least {MEMORY_MIN_CHARS} characters.</p>}
      {error && <ErrorLine text={error} />}

      {check && (
        <div className={`space-y-3 rounded-2xl p-4 ${check.confidential ? "bg-danger/5" : "bg-gold/5"}`}>
          <p className="flex items-start gap-2 text-[15px] font-medium text-ink">
            <ShieldAlert className={`mt-0.5 h-4 w-4 shrink-0 ${check.confidential ? "text-danger" : "text-gold"}`} aria-hidden="true" />
            {check.confidential
              ? "This looks confidential. Minions doesn't keep confidential material, so remove it or use the version below."
              : draft.disclosure === "GENERALIZE"
                ? "This names specifics that would identify someone."
                : "This names people or companies other than you. Their privacy isn't yours to share."}
          </p>
          {check.issues.length > 0 && (
            <ul className="space-y-1">
              {check.issues.map((issue) => (
                <li key={issue.text} className="text-sm text-muted">
                  <span className="rounded bg-surface-3 px-1.5 py-0.5 text-ink">{issue.text}</span> {issue.reason}
                </li>
              ))}
            </ul>
          )}
          {!check.model_checked && <p className="text-sm text-subtle">The name check is unavailable right now; only contact details, secrets and figures were checked.</p>}
          {check.generalized && (
            <div className="rounded-2xl bg-surface px-4 py-3">
              <p className="mb-1 text-sm text-subtle">Without the specifics</p>
              <p className="text-[15px] text-ink">{check.generalized}</p>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCheck(null)}>Keep editing</Button>
            {!check.confidential && (
              <Button variant="secondary" size="sm" onClick={() => persist(draft.content)} disabled={busy !== null}>Save as written</Button>
            )}
            {check.generalized && (
              <Button
                size="sm"
                onClick={() => {
                  setDraft({ ...draft, content: check.generalized! });
                  setCheck(null);
                }}
              >
                Use this version
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
