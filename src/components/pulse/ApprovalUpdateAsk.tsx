"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { notesNeedLook, shouldAsk } from "@/lib/pulse/quickAsk";
import type { ConfirmResult, PulseDTO } from "@/services/pulse";
import { buttonStyles } from "@/components/ui/Button";

const MIN_CHARS = 20;
const inputClass = "w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-subtle focus:border-brand focus:outline-none";

type Step = "hidden" | "ask" | "notes" | "look" | "done";

/**
 * One quiet question under a post that was just approved: the reviewer is in
 * the app and engaged, so this is the easiest moment to keep their experience
 * current. It runs the weekly-update flow and ends by saying what the answer
 * will do. Skipping it never touches the weekly question itself.
 */
export default function ApprovalUpdateAsk() {
  const [step, setStep] = useState<Step>("hidden");
  const [pulse, setPulse] = useState<PulseDTO | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void apiClient
      .get<PulseDTO>("/api/pulse")
      .then((p) => {
        if (cancelled || !shouldAsk(p.state)) return;
        setPulse(p);
        setStep("ask");
      })
      .catch(() => {}); // No ask is better than a broken one.
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(toErrorMessage(e, "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      const p = await apiClient.post<PulseDTO>("/api/pulse", { action: "answer", answer });
      setPulse(p);
      setStep(p.candidates.length === 0 ? "ask" : notesNeedLook(p.candidates) ? "look" : "notes");
      if (p.candidates.length === 0) setError("Nothing specific enough to save. Add what you did, learned or noticed.");
    });

  const save = () =>
    run(async () => {
      const items = (pulse?.candidates ?? []).map(({ kind, content, disclosure }) => ({ kind, content, disclosure }));
      const res = await apiClient.post<ConfirmResult>("/api/pulse/confirm", { items });
      setSaved(res.saved);
      setStep("done");
      window.dispatchEvent(new Event("minions-counts-updated"));
    });

  if (step === "hidden") return null;
  const shell = "flex flex-col gap-3 border-t border-line pt-5";

  if (step === "done") {
    return (
      <div className={shell} role="status">
        <p className="text-[17px] font-medium text-ink">Saved {saved} note{saved === 1 ? "" : "s"}.</p>
        <p className="text-sm leading-relaxed text-muted">
          Minions is turning {saved === 1 ? "it" : "them"} into new post ideas. They land in your Idea Stream in about two minutes.
        </p>
        <Link href="/ideas" className="w-fit text-[15px] text-brand hover:underline">See your ideas</Link>
      </div>
    );
  }

  if (step === "look") {
    return (
      <div className={shell}>
        <p className="text-[17px] font-medium text-ink">One note needs a look first.</p>
        <p className="text-sm leading-relaxed text-muted">It may contain a private detail. Check it on Today before it is saved.</p>
        <Link href="/" className="w-fit text-[15px] text-brand hover:underline">Open Today</Link>
      </div>
    );
  }

  if (step === "notes") {
    return (
      <div className={shell}>
        <p className="text-[17px] font-medium text-ink">Save these for future posts?</p>
        <ul className="space-y-2">
          {(pulse?.candidates ?? []).map((c, i) => (
            <li key={i} className="rounded-2xl bg-surface-2 px-4 py-3 text-[15px] text-ink">{c.content}</li>
          ))}
        </ul>
        <button type="button" disabled={busy} onClick={() => void save()} className={buttonStyles({ size: "lg", block: true })}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Save {pulse?.candidates.length === 1 ? "this note" : `these ${pulse?.candidates.length} notes`}
        </button>
        <button type="button" disabled={busy} onClick={() => setStep("hidden")} className="cursor-pointer py-1 text-center text-[15px] text-muted hover:text-ink disabled:opacity-50">
          Not now
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  const longEnough = answer.trim().length >= MIN_CHARS;
  return (
    <div className={shell}>
      <p className="text-[17px] font-medium text-ink">Anything new since last week?</p>
      <textarea
        rows={2}
        value={answer}
        maxLength={3000}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="One line is enough, e.g. A client asked the same question three times."
        aria-label="What is new"
        className={inputClass}
      />
      <button type="button" disabled={busy || !longEnough} onClick={() => void submit()} className={buttonStyles({ variant: "soft", size: "lg", block: true })}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Reading…" : "Add it"}
      </button>
      <button type="button" disabled={busy} onClick={() => setStep("hidden")} className="cursor-pointer py-1 text-center text-[15px] text-muted hover:text-ink disabled:opacity-50">
        Not now
      </button>
      <p className="text-sm leading-relaxed text-muted">Fresh details make the next posts sound like you, not like everyone.</p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
