"use client";

import { useState } from "react";
import { Check, Loader2, Plus, ShieldAlert } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import {
  MEMORY_DISCLOSURE_META,
  MEMORY_DISCLOSURES,
  MEMORY_KIND_META,
  MEMORY_KINDS,
  MEMORY_MAX_CHARS,
  MEMORY_MIN_CHARS,
  type MemoryDisclosure,
  type MemoryKind,
} from "@/constants/contentLanes";
import type { MemoryCheckResult, MemoryItem } from "@/types";
import { buttonStyles } from "@/components/ui/Button";
import ErrorLine from "@/components/ui/ErrorLine";
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
}: {
  draft: MemoryDraft;
  setDraft: (d: MemoryDraft) => void;
  onSaved: (item: MemoryItem) => void;
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

  return (
    <div className="space-y-3 rounded-xl border border-line bg-[#0B1016] p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[200px_1fr]">
        <select
          value={draft.kind}
          onChange={(e) => update({ kind: e.target.value as MemoryKind })}
          aria-label="Kind of experience"
          className={`${inputClass} cursor-pointer`}
        >
          {MEMORY_KINDS.map((k) => (
            <option key={k} value={k}>
              {MEMORY_KIND_META[k].label}
            </option>
          ))}
        </select>
        <p className="self-center text-[11px] text-subtle">{MEMORY_KIND_META[draft.kind].hint}</p>
      </div>

      <textarea
        rows={3}
        value={draft.content}
        onChange={(e) => update({ content: e.target.value })}
        placeholder="Be specific: what happened, what you did, what changed."
        aria-label="Experience"
        className={`${inputClass} resize-y`}
      />

      <div className="flex flex-wrap items-center gap-2">
        {MEMORY_DISCLOSURES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => update({ disclosure: d })}
            className={`rounded-lg border px-2.5 py-1.5 text-left text-xs cursor-pointer ${
              draft.disclosure === d ? "border-brand bg-brand/10 text-ink" : "border-line text-muted hover:text-ink"
            }`}
          >
            <span className="font-semibold">{MEMORY_DISCLOSURE_META[d].label}</span>
            <span className="ml-1.5 text-subtle">{MEMORY_DISCLOSURE_META[d].hint}</span>
          </button>
        ))}
        <span className="flex-1" />
        <span className={`text-[11px] ${length > MEMORY_MAX_CHARS ? "text-red-400" : "text-subtle"}`}>
          {length}/{MEMORY_MAX_CHARS}
        </span>
        {draft.id && (
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setCheck(null);
            }}
            className="rounded-lg px-3 py-2 text-xs text-muted hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={checkThenSave}
          disabled={!valid || busy !== null || check !== null}
          className={buttonStyles({ size: "sm" })}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : draft.id ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {busy === "checking" ? "Checking…" : draft.id ? "Save changes" : "Add"}
        </button>
      </div>

      {length > 0 && length < MEMORY_MIN_CHARS && (
        <p className="text-[11px] text-subtle">A little more detail: at least {MEMORY_MIN_CHARS} characters.</p>
      )}
      {error && <ErrorLine text={error} />}

      {check && (
        <div className={`space-y-3 rounded-lg border px-3 py-3 ${check.confidential ? "border-red-500/40 bg-red-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
          <p className="flex items-start gap-2 text-xs font-semibold text-ink">
            <ShieldAlert className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${check.confidential ? "text-red-400" : "text-amber-400"}`} />
            {check.confidential
              ? "This looks confidential. Minions doesn't keep confidential material, so remove it or use the version below."
              : draft.disclosure === "GENERALIZE"
                ? "You chose Generalize, but this names specifics that would identify someone."
                : "This names people or companies other than you. Their privacy isn't yours to share."}
          </p>
          {check.issues.length > 0 && (
            <ul className="space-y-1">
              {check.issues.map((issue) => (
                <li key={issue.text} className="text-xs text-muted">
                  <span className="rounded bg-line px-1 py-0.5 font-mono text-ink">{issue.text}</span> {issue.reason}
                </li>
              ))}
            </ul>
          )}
          {!check.model_checked && (
            <p className="text-[11px] text-subtle">The name check is unavailable right now; only contact details, secrets and figures were checked.</p>
          )}
          {check.generalized && (
            <div className="rounded-lg border border-line bg-canvas px-3 py-2">
              <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-subtle">Without the specifics</p>
              <p className="text-sm text-ink">{check.generalized}</p>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setCheck(null)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-ink cursor-pointer"
            >
              Keep editing
            </button>
            {!check.confidential && (
              <button
                type="button"
                onClick={() => persist(draft.content)}
                disabled={busy !== null}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:border-[#2A3D52] disabled:opacity-50 cursor-pointer"
              >
                Save as written
              </button>
            )}
            {check.generalized && (
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, content: check.generalized! });
                  setCheck(null);
                }}
                className={buttonStyles({ size: "sm" })}
              >
                Use this version
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
