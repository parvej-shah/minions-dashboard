"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  FlaskConical,
  Flame,
  GraduationCap,
  Hammer,
  History,
  Lightbulb,
  Loader2,
  Megaphone,
  MessageCircleQuestion,
  Rocket,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { MEMORY_KIND_META, MEMORY_MIN_CHARS, type MemoryKind } from "@/constants/contentLanes";
import type { StoryPrompt } from "@/lib/storyBank";
import type { StoryExtractDTO } from "@/services/storyBank";
import { chunky } from "./chunky";
import Celebration from "./Celebration";
import ResultSheet from "./ResultSheet";
import type { Note, SessionResult } from "./types";

const KIND_ICON: Record<MemoryKind, LucideIcon> = {
  STORY: BookOpen,
  LESSON: GraduationCap,
  OPINION: Megaphone,
  ICP_QUESTION: MessageCircleQuestion,
  CURRENT_WORK: Hammer,
  EXPERIMENT: FlaskConical,
  PAST_EXPERIENCE: History,
  BUILD_IN_PUBLIC: Rocket,
};

const PRAISE = ["Nice one!", "That's a keeper!", "Great detail!", "Love it!"];

type Phase = "answer" | "checking" | "review" | "empty" | "saving";

/**
 * The story session: a full-screen, one-question-at-a-time flow. Answer,
 * check, see the note Minions made, keep it, next. Each kept note is saved
 * as the author goes, so leaving early never loses one.
 */
export default function StorySession({
  prompts,
  streak,
  addedThisWeek,
  onClose,
}: {
  prompts: StoryPrompt[];
  streak: number;
  addedThisWeek: boolean;
  onClose: (result: SessionResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("answer");
  const [notes, setNotes] = useState<Note[]>([]);
  const [saved, setSaved] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [quitting, setQuitting] = useState(false);
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [shake, setShake] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const prompt = prompts[step];
  const Icon = prompt ? KIND_ICON[prompt.kind] : Sparkles;
  const ready = answer.trim().length >= MEMORY_MIN_CHARS;
  const kept = notes.filter((n) => n.keep);
  const blocked = kept.some((n) => n.check?.confidential);
  const tooShort = kept.some((n) => n.content.trim().length < MEMORY_MIN_CHARS);
  const praise = useMemo(() => PRAISE[(step + answer.length) % PRAISE.length], [step, answer.length]);
  // The bar moves when a question is done (saved or skipped), not on each keystroke.
  const progress = finished ? 1 : step / prompts.length;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (phase === "answer" && !finished) textRef.current?.focus();
  }, [step, phase, finished]);

  const finish = useCallback(async (total: number) => {
    let harvest: SessionResult["harvest"] = null;
    if (total > 0) {
      try {
        harvest = await apiClient.post<{ started: boolean; message: string }>("/api/story-bank", { action: "finish" });
      } catch {
        harvest = { started: false, message: "Saved. New ideas will come from the nightly harvest." };
      }
    }
    return { saved: total, harvest };
  }, []);

  const next = useCallback(
    async (total: number) => {
      setNotes([]);
      setAnswer("");
      setError(null);
      if (step + 1 < prompts.length) {
        setStep(step + 1);
        setPhase("answer");
        return;
      }
      setPhase("saving");
      setFinished(await finish(total));
    },
    [finish, prompts.length, step]
  );

  const check = async () => {
    if (!ready) {
      setShake((n) => n + 1);
      return;
    }
    setPhase("checking");
    setError(null);
    try {
      const res = await apiClient.post<StoryExtractDTO>("/api/story-bank", { action: "extract", prompt_id: prompt.id, answer });
      setNotes(res.candidates.map((c) => ({ ...c, keep: true })));
      setPhase(res.candidates.length ? "review" : "empty");
    } catch (e) {
      setError(toErrorMessage(e, "Could not read that. Try again."));
      setPhase("answer");
    }
  };

  const keep = async () => {
    setPhase("saving");
    setError(null);
    try {
      const res = await apiClient.post<{ saved: number }>("/api/story-bank", {
        action: "save",
        items: kept.map(({ kind, content, disclosure }) => ({ kind, content, disclosure })),
      });
      const total = saved + res.saved;
      setSaved(total);
      await next(total);
    } catch (e) {
      setError(toErrorMessage(e, "Could not save that. Try again."));
      setPhase("review");
    }
  };

  const leave = async () => {
    setQuitting(false);
    setPhase("saving");
    onClose(await finish(saved));
  };

  const askToLeave = () => {
    if (finished) return onClose(finished);
    if (saved === 0 && !answer.trim()) return onClose({ saved: 0, harvest: null });
    setQuitting(true);
  };

  // Ctrl/Cmd+Enter runs the main button; Escape asks before leaving.
  // Re-bound every render, so it always sees the current step.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (finished) onClose(finished);
        else if (quitting) setQuitting(false);
        else if (phase === "answer") void check();
        else if (phase === "review" && kept.length && !blocked && !tooShort) void keep();
        else if (phase === "empty") setPhase("answer");
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (quitting) setQuitting(false);
        else askToLeave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const addStarter = (s: string) => {
    setAnswer((a) => (a.trim() ? `${a.trimEnd()} ${s} ` : `${s} `));
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const newStreak = saved > 0 && !addedThisWeek ? streak + 1 : streak;

  return (
    <div role="dialog" aria-modal="true" aria-label="Story session" className="fixed inset-0 z-[80] flex flex-col bg-surface-2 text-ink">
      {/* Top bar: close, progress, streak */}
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 pt-5 pb-3 sm:px-6">
        <button type="button" onClick={askToLeave} aria-label="Close the session" className="rounded-lg p-1 text-subtle transition-colors hover:text-ink cursor-pointer">
          <X className="h-6 w-6" strokeWidth={2.5} />
        </button>
        <div
          className="relative h-4 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={prompts.length}
          aria-valuenow={finished ? prompts.length : step}
        >
          <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${Math.max(progress, 0.04) * 100}%` }}>
            <div className="mx-2 mt-[3px] h-[4px] rounded-full bg-white/30" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-extrabold text-coral" title={`${newStreak}-week streak`}>
          <Flame className={`h-5 w-5 ${newStreak > 0 ? "fill-coral" : "text-subtle"}`} />
          <span key={newStreak} className={newStreak > streak ? "story-pop" : ""}>
            {newStreak}
          </span>
        </div>
      </header>

      {finished ? (
        <Celebration saved={finished.saved} streak={newStreak} grew={newStreak > streak} harvest={finished.harvest} onDone={() => onClose(finished)} />
      ) : (
        <>
          {/* The question */}
          <main className="flex-1 overflow-y-auto">
            <div key={step} className="story-step-in mx-auto w-full max-w-2xl px-4 pt-6 pb-40 sm:px-6 sm:pt-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-brand">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {MEMORY_KIND_META[prompt.kind].label}
                <span className="text-brand/60">
                  · {step + 1} of {prompts.length}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight text-balance sm:text-3xl">{prompt.question}</h2>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {prompt.hint}
              </p>

              <div key={shake} className={shake ? "story-shake" : ""}>
                <textarea
                  ref={textRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={phase !== "answer"}
                  maxLength={3000}
                  rows={5}
                  placeholder={prompt.placeholder}
                  aria-label="Your answer"
                  className="mt-6 w-full resize-none rounded-2xl border-2 border-line bg-surface px-4 py-3.5 text-base leading-relaxed text-ink placeholder:text-muted focus:border-brand focus:outline-none disabled:opacity-70 sm:text-lg"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {prompt.starters.map((s) => (
                  <button key={s} type="button" disabled={phase !== "answer"} onClick={() => addStarter(s)} className={chunky.chip}>
                    {s}…
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-subtle">
                {ready ? (
                  <span className="inline-flex items-center gap-1 text-brand">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> Enough to work with. More detail makes a better post.
                  </span>
                ) : (
                  `A sentence or two is plenty. ${Math.max(0, MEMORY_MIN_CHARS - answer.trim().length)} more characters to go.`
                )}
              </p>
              {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}
            </div>
          </main>

          {/* Footer: skip and check */}
          {(phase === "answer" || phase === "checking" || (phase === "saving" && !notes.length)) && (
            <footer className="border-t-2 border-line bg-surface-2">
              <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
                <button type="button" disabled={phase !== "answer"} onClick={() => void next(saved)} className={chunky.ghost}>
                  Skip
                </button>
                <button type="button" disabled={phase !== "answer" || !answer.trim()} onClick={() => void check()} className={`${chunky.primary} min-w-[9rem] sm:min-w-[11rem]`}>
                  {phase !== "answer" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {phase === "checking" ? "Reading" : "Saving"}
                    </>
                  ) : (
                    "Check"
                  )}
                </button>
              </div>
            </footer>
          )}

          {/* Result sheet */}
          {(phase === "review" || phase === "saving") && notes.length > 0 && (
            <ResultSheet
              praise={praise}
              notes={notes}
              onChange={setNotes}
              busy={phase === "saving"}
              blocked={blocked}
              disabled={!kept.length || blocked || tooShort}
              onEdit={() => setPhase("answer")}
              onKeep={() => void keep()}
              error={error}
            />
          )}
          {phase === "empty" && (
            <section className="story-sheet-up fixed inset-x-0 bottom-0 z-10 border-t-2 border-gold/30 bg-gold/5">
              <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="story-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-white">
                    <Lightbulb className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold text-gold">Add a little more detail</h3>
                    <p className="text-sm text-gold">Say what happened, who it was for, or what changed. One specific moment beats a general summary.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPhase("answer")} className={`${chunky.amber} mt-4 w-full`}>
                  Try again
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {quitting && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/30" onClick={() => setQuitting(false)}>
          <section className="story-sheet-up w-full border-t-2 border-line bg-surface" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-full max-w-2xl px-4 py-6 text-center sm:px-6">
              <h3 className="text-xl font-extrabold">Leave the session?</h3>
              <p className="mt-1 text-sm text-muted">
                {saved > 0
                  ? `Your ${saved} saved stor${saved === 1 ? "y is" : "ies are"} kept, and ideas from ${saved === 1 ? "it" : "them"} start now.`
                  : "Nothing is saved yet. The answer you are writing will be lost."}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <button type="button" autoFocus onClick={() => setQuitting(false)} className={`${chunky.primary} w-full`}>
                  Keep going
                </button>
                <button type="button" onClick={() => void leave()} className="py-2 text-sm font-extrabold uppercase tracking-wider text-danger hover:text-danger cursor-pointer">
                  End session
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
