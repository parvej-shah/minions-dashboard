"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, MessageSquareText, Sparkles, X } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import {
  MEMORY_DISCLOSURES,
  MEMORY_DISCLOSURE_META,
  MEMORY_KINDS,
  MEMORY_KIND_META,
  MEMORY_MAX_CHARS,
  type MemoryDisclosure,
  type MemoryKind,
} from "@/constants/contentLanes";
import type { CheckedCandidate, ConfirmResult, PulseDTO } from "@/services/pulse";
import StoryBankCard from "@/components/stories/StoryBankCard";

import { buttonStyles } from "@/components/ui/Button";
const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none";
const MIN_CHARS = 20;

type Draft = CheckedCandidate & { keep: boolean; open: boolean };

const counts = () => window.dispatchEvent(new Event("minions-counts-updated"));
// A note the privacy check flagged opens in the full editor; the rest read as plain text.
const needsLook = (c: CheckedCandidate) => Boolean(c.check?.confidential || c.check?.issues.length);

/**
 * The weekly question at the top of Editorial Studio (phase 6 of
 * docs/product/authority-flywheel-plan.md). One line answers it; Minions turns
 * the answer into notes the author saves with one click. Shows nothing on the
 * weeks it is not open.
 */
export default function WeeklyPulseCard() {
  const [pulse, setPulse] = useState<PulseDTO | null>(null);
  const [answer, setAnswer] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<null | "answer" | "confirm" | "snooze" | "skip" | "tz">(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [browserTz, setBrowserTz] = useState<string | null>(null);

  const apply = useCallback((p: PulseDTO) => {
    setPulse(p);
    setDrafts(p.candidates.map((c) => ({ ...c, keep: true, open: needsLook(c) })));
    if (p.answer) setAnswer((a) => a || p.answer || "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await apiClient.get<PulseDTO>("/api/pulse");
        if (cancelled) return;
        apply(p);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Nothing to ask when the browser agrees with the workspace.
        if (!p.settings.timezone_confirmed && tz === p.settings.timezone) {
          void apiClient.patch("/api/pulse/settings", { timezone_confirmed: true }).catch(() => {});
        } else if (!p.settings.timezone_confirmed) setBrowserTz(tz);
      } catch {
        // No card is better than a broken one in the Studio.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const act = async (kind: NonNullable<typeof busy>, run: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await run();
    } catch (e) {
      setError(toErrorMessage(e, "Something went wrong. Try again."));
    } finally {
      setBusy(null);
    }
  };

  const setTimezone = (tz: string | null) =>
    act("tz", async () => {
      apply(await apiClient.patch<PulseDTO>("/api/pulse/settings", tz ? { timezone: tz } : { timezone_confirmed: true }));
      setBrowserTz(null);
      counts();
    });

  const longEnough = answer.trim().length >= MIN_CHARS;
  const submit = () =>
    act("answer", async () => {
      const p = await apiClient.post<PulseDTO>("/api/pulse", { action: "answer", answer });
      apply(p);
      setEditing(false);
    });

  const confirm = (items: Draft[]) =>
    act("confirm", async () => {
      const res = await apiClient.post<ConfirmResult>("/api/pulse/confirm", {
        items: items.filter((d) => d.keep).map(({ kind, content, disclosure }) => ({ kind, content, disclosure })),
      });
      apply(res.pulse);
      setDone(
        res.saved
          ? `Saved ${res.saved} note${res.saved === 1 ? "" : "s"} to your experience. ${res.harvest?.started ? "New ideas from them arrive in the Idea Stream in about two minutes." : res.harvest?.message ?? ""}`
          : "Nothing saved this week."
      );
      counts();
    });

  const simple = (action: "snooze" | "skip") =>
    act(action, async () => {
      apply(await apiClient.post<PulseDTO>("/api/pulse", { action }));
      counts();
    });

  if (!pulse) return null;

  const tzBanner = browserTz && (
    <div className="flex flex-wrap items-center gap-3 rounded-[28px] bg-surface-2 px-6 py-4 text-[15px] text-muted">
      <Clock className="h-4 w-4 text-brand" />
      <span className="flex-1 min-w-[200px]">
        This workspace runs on <b className="text-ink">{pulse.settings.timezone}</b>. Your browser says{" "}
        <b className="text-ink">{browserTz}</b>. The weekly question and posting times follow the workspace timezone.
      </span>
      <button type="button" disabled={busy === "tz"} onClick={() => void setTimezone(browserTz)} className={buttonStyles()}>
        Use {browserTz}
      </button>
      <button type="button" disabled={busy === "tz"} onClick={() => void setTimezone(null)} className="rounded-lg border border-line px-3 py-1.5 text-ink disabled:opacity-50 cursor-pointer">
        Keep {pulse.settings.timezone}
      </button>
    </div>
  );

  if (done) {
    return (
      <div className="space-y-3">
        {tzBanner}
        <div className="flex items-start gap-3 rounded-[28px] bg-brand/5 p-6 text-[15px] text-ink">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span className="flex-1">{done}</span>
          <Link href="/brand?tab=experience" className="text-xs text-brand hover:underline">
            See your updates
          </Link>
        </div>
      </div>
    );
  }

  const open = pulse.state === "DUE" || pulse.state === "CONFIRM";
  // One ask at a time: the story bank card only on weeks the question is not open.
  if (!open) {
    return (
      <div className="space-y-3 empty:hidden">
        {tzBanner}
        <StoryBankCard />
      </div>
    );
  }

  const confirming = pulse.state === "CONFIRM" && !editing;
  const kept = drafts.filter((d) => d.keep);
  const blocked = kept.some((d) => d.check?.confidential);
  const setDraft = (i: number, next: Draft) => setDrafts(drafts.map((x, j) => (j === i ? next : x)));

  if (!confirming) {
    // The answer is typed straight into the strip: Enter turns it into notes.
    return (
      <div className="space-y-3">
        {tzBanner}
        <section className="space-y-3 rounded-[28px] bg-surface shadow-soft p-6 sm:p-8">
          <p className="flex items-start gap-2 text-[17px] text-ink">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
            <span>
              <span className="font-semibold text-coral">This week: </span>
              {pulse.question}
            </span>
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <textarea
              rows={1}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (longEnough && !busy) void submit();
                }
              }}
              maxLength={3000}
              placeholder="One line is enough, e.g. Agents only open the 3-line call summary, never the transcript."
              aria-label="Your answer"
              className={`${inputClass} min-w-0 flex-1 basis-64 resize-none [field-sizing:content] max-h-40`}
            />
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={!!busy || !longEnough} onClick={() => void submit()} className={buttonStyles({ size: "sm" })}>
                {busy === "answer" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {busy === "answer" ? "Reading…" : "Save"}
              </button>
              {editing ? (
                <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-2.5 py-2 text-xs text-muted hover:text-ink cursor-pointer">
                  Back to the notes
                </button>
              ) : (
                <>
                  <button type="button" disabled={!!busy} onClick={() => void simple("snooze")} className="rounded-lg px-2.5 py-2 text-xs text-muted hover:text-ink disabled:opacity-50 cursor-pointer">
                    Later
                  </button>
                  <button type="button" aria-label="Skip this week" title="Skip this week" disabled={!!busy} onClick={() => void simple("skip")} className="rounded-lg p-2 text-subtle hover:text-ink disabled:opacity-50 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          {answer.trim() && !longEnough && <p className="text-[11px] text-subtle">A few more words, so there is something specific to use.</p>}
          {error && <p className="text-xs text-danger">{error}</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tzBanner}
      <section className="space-y-4 rounded-[28px] bg-surface shadow-soft p-6 sm:p-8">
        <div className="flex items-start gap-2">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
          <p className="text-sm text-ink">
            <span className="font-semibold text-coral">From your answer: </span>
            {drafts.length ? "save these notes for future posts. Nothing is stored until you do." : "nothing specific enough to save. Add what you did, learned or noticed."}
          </p>
        </div>

        {drafts.length > 0 && (
          <ul className="space-y-2">
            {drafts.map((d, i) =>
              !d.keep ? null : d.open ? (
                <li key={i}>
                  <CandidateEditor draft={d} onChange={(next) => setDraft(i, next)} />
                </li>
              ) : (
                <li key={i} className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
                  <span className="flex-1">{d.content}</span>
                  <button type="button" onClick={() => setDraft(i, { ...d, open: true })} className="text-xs text-brand hover:underline cursor-pointer">
                    Edit
                  </button>
                  <button type="button" aria-label="Drop this note" title="Drop this note" onClick={() => setDraft(i, { ...d, keep: false })} className="text-subtle hover:text-ink cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            )}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {kept.length > 0 && (
            <button
              type="button"
              disabled={!!busy || blocked || kept.some((d) => d.content.trim().length < MIN_CHARS)}
              onClick={() => void confirm(drafts)}
              className={buttonStyles({ size: "sm" })}
            >
              {busy === "confirm" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save {kept.length} note{kept.length === 1 ? "" : "s"}
            </button>
          )}
          <button type="button" disabled={!!busy} onClick={() => setEditing(true)} className="rounded-lg border border-line px-3 py-2 text-xs text-ink disabled:opacity-50 cursor-pointer">
            Edit my answer
          </button>
          <button type="button" disabled={!!busy} onClick={() => void confirm([])} className="rounded-lg px-3 py-2 text-xs text-muted hover:text-ink disabled:opacity-50 cursor-pointer">
            Save nothing this week
          </button>
          {blocked && <span className="text-[11px] text-danger">Remove the confidential detail before saving.</span>}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </section>
    </div>
  );
}

function CandidateEditor({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const issues = draft.check?.issues ?? [];
  return (
    <div className={`space-y-2 rounded-xl border p-3 ${draft.keep ? "border-line bg-surface-2" : "border-line/50 opacity-50"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer">
          <input type="checkbox" checked={draft.keep} onChange={(e) => onChange({ ...draft, keep: e.target.checked })} className="accent-brand" />
          Keep
        </label>
        <select
          value={draft.kind}
          onChange={(e) => onChange({ ...draft, kind: e.target.value as MemoryKind })}
          aria-label="Kind of note"
          className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs text-ink cursor-pointer"
        >
          {MEMORY_KINDS.map((k) => (
            <option key={k} value={k}>
              {MEMORY_KIND_META[k].label}
            </option>
          ))}
        </select>
        {MEMORY_DISCLOSURES.map((v) => (
          <button
            key={v}
            type="button"
            title={MEMORY_DISCLOSURE_META[v].hint}
            onClick={() => onChange({ ...draft, disclosure: v as MemoryDisclosure })}
            className={`rounded-lg border px-2 py-1 text-xs cursor-pointer ${draft.disclosure === v ? "border-brand bg-brand/10 text-ink" : "border-line text-muted"}`}
          >
            {MEMORY_DISCLOSURE_META[v].label}
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={draft.content}
        maxLength={MEMORY_MAX_CHARS}
        onChange={(e) => onChange({ ...draft, content: e.target.value, check: draft.check && { ...draft.check, confidential: false } })}
        aria-label="Note"
        className={`${inputClass} resize-y`}
      />
      {issues.length > 0 && (
        <ul className="space-y-1 text-[11px] text-gold">
          {issues.map((iss, j) => (
            <li key={j}>
              <b>{iss.text}</b>: {iss.reason}
            </li>
          ))}
          {draft.check?.generalized && (
            <li>
              <button type="button" onClick={() => onChange({ ...draft, content: draft.check!.generalized!, disclosure: "GENERALIZE", check: { ...draft.check!, issues: [], confidential: false } })} className="text-brand hover:underline cursor-pointer">
                Use a version without these details
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
