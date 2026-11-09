"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { FULL_AT, SESSION_SIZE } from "@/lib/storyBank";
import type { StoryBankDTO } from "@/services/storyBank";
import StorySession from "./StorySession";
import PasteCard from "./PasteCard";
import type { SessionResult } from "./types";

const DISMISS_KEY = "minions-story-bank-hidden-until";
/** The X hides the card for a week: a reminder, never a nag. */
const HIDE_MS = 7 * 86_400_000;

/**
 * The home card that appears when the story bank runs low: how many unused
 * stories are left, the weekly streak, and a button into the session. At most
 * once a week: it stays away in any week the author already added a story,
 * and the X hides it for seven days.
 */
export default function StoryBankCard() {
  const [bank, setBank] = useState<StoryBankDTO | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<StoryBankDTO>("/api/story-bank")
      .then((b) => {
        if (cancelled) return;
        try {
          setDismissed(Date.now() < Number(localStorage.getItem(DISMISS_KEY) || 0));
        } catch {
          // Storage blocked: show the card.
        }
        setBank(b);
      })
      .catch(() => {
        // No card is better than a broken one on the home page.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + HIDE_MS));
    } catch {
      // Hidden for this visit only.
    }
  };

  const close = (r: SessionResult) => {
    setOpen(false);
    if (r.saved > 0) {
      setResult(r);
      window.dispatchEvent(new Event("minions-counts-updated"));
    }
  };

  if (result) {
    return (
      <div className="flex items-start gap-3 rounded-[28px] bg-brand/5 p-6 text-[15px] text-ink">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <span className="flex-1">
          Saved {result.saved} new {result.saved === 1 ? "story" : "stories"}.{" "}
          {result.harvest?.started ? "New ideas from them arrive in the Idea Stream in about two minutes." : result.harvest?.message}
        </span>
      </div>
    );
  }

  // Nothing of the author's own yet: pasting what they already wrote is the quickest start.
  if (bank && bank.total === 0 && !dismissed) return <PasteCard onDismiss={dismiss} onDone={close} />;

  // Quiet by default: only when the bank is low and the author has added nothing this week.
  if (!bank || !bank.low || bank.added_this_week || dismissed || !bank.prompts.length) return null;

  const left = bank.unused;
  return (
    <>
      <section className="relative rounded-[28px] bg-surface shadow-soft p-6 sm:p-8">
        <button type="button" onClick={dismiss} aria-label="Hide for a week" className="absolute right-3 top-3 rounded-lg p-1 text-subtle hover:text-ink cursor-pointer">
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 pr-6">
            <p className="text-sm font-semibold text-gold">● Running low on your stories</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">
              {left === 0 ? "Every story you gave has been used" : `${left} unused ${left === 1 ? "story" : "stories"} left`}
            </h2>
            <p className="mt-2 text-[17px] leading-relaxed text-muted">
              {left === 0
                ? "New ideas will start retelling old ones."
                : "About one more round of ideas before they start retelling old ones."}{" "}
              Answer {SESSION_SIZE} quick questions to refill it.
            </p>
            {/* One segment per story; a full bank lasts about three harvests. */}
            <div className="mt-3 flex gap-1" aria-label={`${left} of ${FULL_AT} stories`}>
              {Array.from({ length: FULL_AT }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < left ? "bg-gold" : "bg-surface-3"}`} />
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setOpen(true)} className={buttonStyles({ size: "lg", className: "w-full sm:w-auto" })}>
            Add stories · 2 min
          </button>
        </div>
      </section>
      {/* On <body>, so no transformed ancestor can trap the full-screen layer. */}
      {open &&
        createPortal(
          <StorySession prompts={bank.prompts} streak={bank.streak_weeks} addedThisWeek={bank.added_this_week} onClose={close} />,
          document.body
        )}
    </>
  );
}
