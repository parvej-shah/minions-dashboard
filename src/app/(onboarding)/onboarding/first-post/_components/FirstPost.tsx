"use client";

import { DEFAULT_TIMEZONE } from "@/constants/config";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AssetItem } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { plainReviewNotes } from "@/lib/drafts/plainNotes";
import { buttonStyles } from "@/components/ui/Button";
import LinkedInPostPreview from "@/components/editorial/LinkedInPostPreview";
import DraftChecks from "@/components/editorial/DraftChecks";
import { StepFooter, StepHeader, StepTitle, ThinBar, stepInput } from "@/components/ui/Steps";
import { WaitingSkeleton } from "./FirstPostSkeleton";

interface FirstPostStatus {
  idea_id: string | null;
  story: string | null;
  run: { id: string; status: string; started_at: string } | null;
  asset: AssetItem | null;
  signoff?: Signoff;
}

/** The cover's author line: the name and the line under it. */
interface Signoff {
  name: string;
  role: string;
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
  // Only what the user typed; the rest shows the cover as drawn.
  const [signoffEdits, setSignoffEdits] = useState<Partial<Signoff>>({});

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
  // The sign-off is the last thing setup asks, once the post has shown what
  // it's for. A changed one redraws the cover before review opens.
  const signoff: Signoff = { name: "", role: "", ...status?.signoff, ...signoffEdits };
  const signoffChanged =
    Boolean(status?.signoff) && (signoff.name.trim() !== status?.signoff?.name || signoff.role.trim() !== status?.signoff?.role);

  const review = async () => {
    if (!status?.asset) return;
    if (signoffChanged && !signoff.name.trim()) {
      setError("Add the name to show on your covers.");
      return;
    }
    setBusy("review");
    setError(null);
    if (signoffChanged) {
      try {
        await apiClient.post("/api/onboarding/first-post/signoff", { name: signoff.name.trim(), role: signoff.role.trim() });
      } catch (err) {
        setError(toErrorMessage(err, "Couldn't update your cover. Please try again."));
        setBusy(null);
        return;
      }
    }
    router.push(`/editorial?id=${encodeURIComponent(status.asset.id)}`);
  };


  if (!status || !phase) {
    return error ? (
      <Frame>
        <Stuck title="We couldn't load your post." detail={error} />
      </Frame>
    ) : (
      <WaitingSkeleton />
    );
  }

  return (
    <Frame>
      {phase === "writing" && <Writing startedAt={status.run?.started_at ?? null} />}
      {phase === "missing" && <Stuck title="Your first post didn't start." detail="Add an idea from the Ideas page and it will be written from there." />}
      {phase === "stuck" && (
        <>
          <Stuck title="Writing hit a snag." detail="This happens now and then. Your story is saved, so trying again picks up from it." />
          <StepFooter
            label="Try again"
            onContinue={() => void retry()}
            loading={busy === "retry"}
            error={error}
            secondary={
              <Link href="/" className="text-[15px] text-brand underline-offset-4 hover:underline">
                Go to my dashboard
              </Link>
            }
          />
        </>
      )}

      {phase === "ready" && status.asset && (
        <>
          <Ready asset={status.asset} author={author}>
            {status.signoff && (
              <SignoffFields value={signoff} disabled={busy !== null} onChange={(edit) => setSignoffEdits((prev) => ({ ...prev, ...edit }))} />
            )}
          </Ready>
          <StepFooter
            label={busy === "review" && signoffChanged ? "Updating your cover…" : "Review my post"}
            onContinue={() => void review()}
            loading={busy === "review"}
            disabled={busy !== null}
            error={error}
          />
        </>
      )}

      {phase === "scheduled" && status.asset && <Scheduled asset={status.asset} />}
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <StepHeader />
      {children}
    </div>
  );
}

/** A centered screen: title, line, then whatever comes under it. */
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="animate-rise-in flex w-full max-w-xl flex-col items-center">{children}</div>
    </main>
  );
}

function Writing({ startedAt }: { startedAt: string | null }) {
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
    <Centered>
      <StepTitle center title="Writing your first post." line="About a minute. Every line is checked against what you told us." />
      <div className="mt-9">
        <ThinBar value={share} label="Writing your first post" />
      </div>
      <p className="mt-3.5 text-[15px] text-subtle" aria-live="polite">
        {WRITING_STEPS[active].label}
      </p>
      <Link href="/" className="mt-12 text-[15px] text-brand underline-offset-4 hover:underline">
        Look around while you wait
      </Link>
    </Centered>
  );
}

/** Setup's last question: how the cover signs off. */
function SignoffFields({ value, disabled, onChange }: { value: Signoff; disabled: boolean; onChange: (edit: Partial<Signoff>) => void }) {
  return (
    <section className="mt-12">
      <h2 className="text-[21px] font-semibold text-ink">How should your covers sign off?</h2>
      <p className="mt-1.5 text-[15px] text-muted">At the bottom of every cover. Change it any time in Brand.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[15px] font-medium text-ink" htmlFor="signoff-name">
            Name
          </label>
          <input
            id="signoff-name"
            type="text"
            value={value.name}
            maxLength={60}
            disabled={disabled}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Jordan Lee"
            className={`${stepInput} mt-2`}
          />
        </div>
        <div>
          <label className="block text-[15px] font-medium text-ink" htmlFor="signoff-role">
            Line under it <span className="font-normal text-subtle">(optional)</span>
          </label>
          <input
            id="signoff-role"
            type="text"
            value={value.role}
            maxLength={90}
            disabled={disabled}
            onChange={(e) => onChange({ role: e.target.value })}
            placeholder="e.g. Founder at Acme"
            className={`${stepInput} mt-2`}
          />
        </div>
      </div>
    </section>
  );
}

function Ready({ asset, author, children }: { asset: AssetItem; author: { name: string; image: string | null }; children?: React.ReactNode }) {
  const notes = useMemo(() => plainReviewNotes(asset), [asset]);
  return (
    <main className="flex-1">
      <div className="animate-rise-in mx-auto w-full max-w-xl px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
        <StepTitle title="Here's your first post." line="As it will look on LinkedIn. Nothing goes out until you approve it." />
        <LinkedInPostPreview author={author} text={postText(asset)} imageUrl={asset.hero_image_url} className="mt-9" />
        {children}
        <DraftChecks notes={notes} className="mt-8" />
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
    ? new Date(asset.scheduled_for).toLocaleString("en-US", { timeZone: DEFAULT_TIMEZONE, weekday: "long", hour: "numeric", minute: "2-digit" })
    : null;
  const needsLinkedIn = linkedIn === false;

  return (
    <Centered>
      <StepTitle
        center
        title="You're on the calendar."
        line={`${when ? `Your first post goes out ${when}.` : "Your first post is scheduled."} ${needsLinkedIn ? "Connect LinkedIn so it can go out." : "Change it any time."}`}
      />
      <div className="mt-9 flex w-full max-w-xs flex-col items-center gap-4">
        {needsLinkedIn && (
          <Link
            href="/api/auth/linkedin/connect?return_to=/onboarding/first-post"
            prefetch={false}
            className={buttonStyles({ variant: "primary", size: "lg", block: true })}
          >
            Connect LinkedIn
          </Link>
        )}
        {needsLinkedIn ? (
          <Link href="/" className="text-[15px] text-brand underline-offset-4 hover:underline">
            Later, go to my dashboard
          </Link>
        ) : (
          <Link href="/" className={buttonStyles({ variant: "primary", size: "lg", block: true })}>
            Go to my dashboard
          </Link>
        )}
      </div>
    </Centered>
  );
}

function Stuck({ title, detail }: { title: string; detail: string }) {
  return (
    <Centered>
      <StepTitle center title={title} line={detail} />
    </Centered>
  );
}
