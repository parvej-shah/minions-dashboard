"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Flame, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { FULL_AT, SESSION_SIZE } from "@/lib/storyBank";
import type { StoryBankDTO } from "@/services/storyBank";
import StorySession, { type SessionResult } from "./StorySession";
import { chunky } from "./chunky";

const DISMISS_KEY = "minions-story-bank-dismissed";
const today = () => new Date().toISOString().slice(0, 10);

/**
 * The home card that appears when the story bank runs low: how many unused
 * stories are left, the weekly streak, and a button into the session.
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
          setDismissed(localStorage.getItem(DISMISS_KEY) === today());
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
      localStorage.setItem(DISMISS_KEY, today());
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
      <div className="flex items-start gap-3 rounded-2xl border border-[#00C9A7]/30 bg-[#00C9A7]/5 p-4 text-sm text-[#F1F5F9]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00C9A7]" />
        <span className="flex-1">
          Saved {result.saved} new {result.saved === 1 ? "story" : "stories"}.{" "}
          {result.harvest?.started ? "New ideas from them arrive in the Idea Stream in about two minutes." : result.harvest?.message}
        </span>
      </div>
    );
  }

  if (!bank || !bank.low || dismissed || !bank.prompts.length) return null;

  const left = bank.unused;
  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border-2 border-[#1F2D3D] bg-[#0F1419] p-5">
        <button type="button" onClick={dismiss} aria-label="Hide until tomorrow" className="absolute right-3 top-3 rounded-lg p-1 text-[#64748B] hover:text-[#F1F5F9] cursor-pointer">
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest">
              <span className="text-[#F59E0B]">Story bank low</span>
              {bank.streak_weeks > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9F43]/10 px-2 py-0.5 text-[#FF9F43]">
                  <Flame className="h-3 w-3 fill-[#FF9F43]" /> {bank.streak_weeks}-week streak
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg font-extrabold text-[#F1F5F9]">
              {left === 0 ? "Every story you gave has been used" : `${left} unused ${left === 1 ? "story" : "stories"} left`}
            </h2>
            <p className="mt-0.5 text-sm text-[#94A3B8]">
              {left === 0
                ? "New ideas will start retelling old ones."
                : "About one more round of ideas before they start retelling old ones."}{" "}
              Answer {SESSION_SIZE} quick questions to refill it.
            </p>
            {/* One segment per story; a full bank lasts about three harvests. */}
            <div className="mt-3 flex gap-1" aria-label={`${left} of ${FULL_AT} stories`}>
              {Array.from({ length: FULL_AT }, (_, i) => (
                <span key={i} className={`h-2.5 flex-1 rounded-full ${i < left ? "bg-[#F59E0B]" : "bg-[#1F2D3D]"}`} />
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setOpen(true)} className={`${chunky.primary} w-full sm:w-auto`}>
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
