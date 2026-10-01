"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check, Loader2, PenLine, Quote, RotateCcw, Sparkles } from "lucide-react";
import type { AssetItem } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { plainReviewNotes } from "@/lib/drafts/plainNotes";
import { buttonStyles } from "@/components/ui/Button";
import LinkedInPostPreview from "@/components/editorial/LinkedInPostPreview";
import DraftChecks from "@/components/editorial/DraftChecks";
import { Confetti, LessonFooter, LessonHeader } from "../../setup/_components/lesson";
import { WaitingSkeleton } from "./FirstPostSkeleton";

interface FirstPostStatus {
  idea_id: string | null;
  story: string | null;
  run: { id: string; status: string; started_at: string } | null;
  asset: AssetItem | null;
}

type Phase = "writing" | "stuck" | "missing" | "ready" | "scheduled";

/** The drafting pipeline takes about this long; the progress bar paces itself to it. */
const EXPECTED_SECONDS = 60;
const POLL_MS = 5000;
/** The cover lands a few seconds after the post; past this, show the post without it. */
const COVER_WAIT_SECONDS = 90;

const WRITING_STEPS = [
  { at: 0, label: "Planning the angle" },
  { at: 18, label: "Writing the first draft" },
  { at: 32, label: "Checking every claim" },
  { at: 44, label: "Designing your cover" },
];

function phaseOf(s: FirstPostStatus): Phase {
  if (s.asset) {
    if (s.asset.status === "SCHEDULED") return "scheduled";
    // The reveal shows the post with its cover, so wait for the cover too.
    const age = (Date.now() - new Date(s.asset.created_at).getTime()) / 1000;
    return s.asset.hero_status === "PENDING" && age < COVER_WAIT_SECONDS ? "writing" : "ready";
  }
  if (!s.idea_id) return "missing";
  // COMPLETED without an asset yet: the sync lands a moment after the callback.
  if (s.run && (s.run.status === "RUNNING" || s.run.status === "COMPLETED")) return "writing";
  return "stuck";
}

function postText(asset: AssetItem) {
  return asset.variants.linkedin?.trim() || [asset.hook, asset.body_content].filter(Boolean).join("\n\n");
}

export default function FirstPost({ author }: { author: { name: string; image: string | null } }) {
  const router = useRouter();
  const [status, setStatus] = useState<FirstPostStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"retry" | "review" | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await apiClient.get<FirstPostStatus>("/api/onboarding/first-post"));
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't check on your post."));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<FirstPostStatus>("/api/onboarding/first-post")
      .then((s) => !cancelled && setStatus(s))
      .catch((err) => !cancelled && setError(toErrorMessage(err, "Couldn't check on your post.")));
    return () => {
      cancelled = true;
    };
  }, []);

  const phase = status ? phaseOf(status) : null;

  useEffect(() => {
    if (phase !== "writing") return;
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [phase, load]);

  const retry = async () => {
    setBusy("retry");
    setError(null);
    try {
      await apiClient.post("/api/onboarding/first-post", {});
      await load();
    } catch (err) {
      setError(toErrorMessage(err, "Writing couldn't start. Please try again in a minute."));
    } finally {
      setBusy(null);
    }
  };

  // Setup ends in Editorial Studio, where the post, cover and carousel are
  // reviewed and scheduled, rather than posting from this screen.
  const review = () => {
    if (!status?.asset) return;
    setBusy("review");
    router.push(`/editorial?id=${encodeURIComponent(status.asset.id)}`);
  };

  if (!status || !phase) {
    return error ? <Stuck title="We couldn't load your post" detail={error} /> : <WaitingSkeleton />;
  }

  const progress = phase === "scheduled" ? 1 : phase === "ready" ? 0.95 : 0.78;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <LessonHeader progress={progress} />

      {phase === "writing" && <Writing startedAt={status.run?.started_at ?? null} story={status.story} />}
      {phase === "missing" && <Stuck title="Your first post didn't start" detail="Add an idea from the Ideas page and we'll write it from there." />}
      {phase === "stuck" && (
        <>
          <Stuck
            title="Writing hit a snag"
            detail="This happens now and then. Your story is saved, so trying again picks up from it."
            story={status.story}
          />
          <LessonFooter
            label="Try again"
            onContinue={() => void retry()}
            loading={busy === "retry"}
            error={error}
            secondary={
              <Link href="/" className={buttonStyles({ variant: "ghost", size: "lg", block: true, className: "sm:w-auto" })}>
                Go to my dashboard
              </Link>
            }
          />
        </>
      )}

      {phase === "ready" && status.asset && (
        <>
          <Ready asset={status.asset} author={author} story={status.story} />
          <LessonFooter
            label="Review my post"
            onContinue={review}
            loading={busy === "review"}
            disabled={busy !== null}
            error={error}
          />
        </>
      )}

      {phase === "scheduled" && status.asset && <Scheduled asset={status.asset} />}
    </div>
  );
}

function Writing({ startedAt, story }: { startedAt: string | null; story: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const started = startedAt ? new Date(startedAt).getTime() : now;
  const elapsed = Math.max(0, (now - started) / 1000);
  const active = WRITING_STEPS.reduce((acc, step, i) => (elapsed >= step.at ? i : acc), 0);
  // Eases toward full and never claims done before the post really is.
  const share = Math.min(0.95, 1 - Math.exp(-elapsed / (EXPECTED_SECONDS / 2.2)));

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-8 pb-16 text-center sm:pt-12">
      <span className="story-pop relative flex h-24 w-24 items-center justify-center rounded-full border-b-8 border-brand-edge bg-brand text-brand-ink">
        <PenLine className="h-11 w-11 animate-pulse" strokeWidth={2.25} />
      </span>
      <h1 className="mt-8 text-2xl font-extrabold sm:text-3xl">Writing your first post…</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">About a minute. Every claim gets checked against what you told us.</p>

      <div className="mt-6 h-3 w-full max-w-xs overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-linear" style={{ width: `${share * 100}%` }} />
      </div>

      <ol className="mt-8 w-full max-w-xs space-y-3 text-left" aria-live="polite">
        {WRITING_STEPS.map((step, i) => {
          const state = i < active ? "done" : i === active ? "active" : "todo";
          return (
            <li key={step.label} className={`flex items-center gap-3 text-base font-bold ${state === "todo" ? "text-subtle" : "text-ink"}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  state === "done" ? "border-brand bg-brand text-brand-ink" : state === "active" ? "border-brand text-brand" : "border-line"
                }`}
              >
                {state === "done" ? <Check className="h-4 w-4 animate-pop-in" strokeWidth={3.5} /> : state === "active" ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} /> : null}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>

      {story && <StoryCard story={story} className="mt-10 max-w-lg" />}

      <Link href="/" className={`${buttonStyles({ variant: "ghost", size: "md" })} mt-6`}>
        Look around while I wait
      </Link>
      <p className="mt-1 text-xs text-subtle">Your post will be waiting in Editorial Studio.</p>
    </main>
  );
}

/** What the post is built from, so the link between input and output is visible. */
function StoryCard({ story, className = "" }: { story: string; className?: string }) {
  return (
    <figure className={`w-full rounded-2xl border-2 border-line bg-surface p-4 text-left ${className}`}>
      <figcaption className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-subtle">
        <Quote className="h-3.5 w-3.5" aria-hidden="true" />
        Built from what you told us
      </figcaption>
      <blockquote className="mt-2 line-clamp-4 text-sm leading-relaxed text-[#CBD5E1]">{story}</blockquote>
    </figure>
  );
}

function Ready({ asset, author, story }: { asset: AssetItem; author: { name: string; image: string | null }; story: string | null }) {
  const notes = useMemo(() => plainReviewNotes(asset), [asset]);
  return (
    <main className="flex-1">
      <div className="story-step-in mx-auto w-full max-w-xl px-4 pt-4 pb-10 sm:px-6 sm:pt-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Confetti />
            <span className="story-pop relative flex h-16 w-16 items-center justify-center rounded-full border-b-[6px] border-gold-edge bg-gold text-[#1F1300]">
              <Sparkles className="h-8 w-8" strokeWidth={2.25} />
            </span>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-gold sm:text-3xl">Your first post is ready!</h1>
          <p className="mt-1.5 text-sm text-muted">This is how people will see it on LinkedIn. Nothing goes out until you approve it.</p>
        </div>

        <LinkedInPostPreview author={author} text={postText(asset)} imageUrl={asset.hero_image_url} className="animate-rise-in mt-6" />
        <DraftChecks notes={notes} className="mt-4" />
        {story && <StoryCard story={story} className="mt-4" />}
      </div>
    </main>
  );
}

function Scheduled({ asset }: { asset: AssetItem }) {
  const [linkedIn, setLinkedIn] = useState<boolean | null>(null);
  useEffect(() => {
    apiClient
      .get<{ channels?: Array<{ key: string; has_credential?: boolean }> }>("/api/channels")
      .then((r) => setLinkedIn(Boolean(r.channels?.some((c) => c.key === "linkedin" && c.has_credential))))
      .catch(() => setLinkedIn(false));
  }, []);

  const when = asset.scheduled_for
    ? new Date(asset.scheduled_for).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-10 pb-16 text-center">
      <div className="relative">
        <Confetti />
        <span className="story-pop relative flex h-24 w-24 items-center justify-center rounded-full border-b-8 border-brand-edge bg-brand text-brand-ink">
          <CalendarCheck className="h-11 w-11" strokeWidth={2.25} />
        </span>
      </div>
      <h1 className="mt-8 text-3xl font-extrabold">You’re on the calendar!</h1>
      <p className="mt-2 max-w-sm text-base text-muted">
        {when ? `Your first post goes out ${when}.` : "Your first post is scheduled."} You can change it any time in Editorial Studio.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3">
        {linkedIn === false && (
          <div className="animate-rise-in rounded-2xl border-2 border-gold/40 bg-gold/5 p-4 text-left">
            <p className="text-base font-extrabold text-gold">One last step: connect LinkedIn</p>
            <p className="mt-1 text-sm text-muted">So your post can actually go out. It takes ten seconds.</p>
            <Link
              href="/api/auth/linkedin/connect?return_to=/onboarding/first-post"
              prefetch={false}
              className={buttonStyles({ variant: "gold", size: "lg", block: true, shout: true, className: "mt-4" })}
            >
              Connect LinkedIn
            </Link>
          </div>
        )}
        <Link href="/" className={buttonStyles({ variant: linkedIn === false ? "ghost" : "primary", size: "lg", block: true, shout: linkedIn !== false })}>
          {linkedIn === false ? "Later, take me to my dashboard" : "Go to my dashboard"}
        </Link>
      </div>
    </main>
  );
}

function Stuck({ title, detail, story }: { title: string; detail: string; story?: string | null }) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-12 pb-10 text-center">
      <span className="story-shake flex h-20 w-20 items-center justify-center rounded-full border-b-8 border-coral-edge bg-coral text-white">
        <RotateCcw className="h-9 w-9" strokeWidth={2.5} />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">{detail}</p>
      {story && <StoryCard story={story} className="mt-8 max-w-lg" />}
    </main>
  );
}
