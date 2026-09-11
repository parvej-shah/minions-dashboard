import { describe, it, expect } from "vitest";
import type { HeroStatus } from "@/types";

/**
 * Cover generation moved off the drafting critical path: Qwen Image 3.0 Pro was
 * ~43s of a ~98s run, so the draft is now saved with `hero_status: PENDING` and
 * 04_hero_image attaches the image a minute or so later.
 *
 * That split is only safe because a PENDING cover is never treated as a usable
 * one. These pin the two rules that keep it safe.
 */

/** Mirrors `autoPublish` in Prepare Asset Row (02_idea_to_asset). */
function autoPublish(opts: {
  claimsOk: boolean;
  requireReview: boolean;
  heroIsPermanent: boolean;
}): boolean {
  return opts.claimsOk && !opts.requireReview && opts.heroIsPermanent;
}

/** Mirrors the terminal-state check in /api/internal/assets/hero. */
const TERMINAL: HeroStatus[] = ["READY", "BLOCKED_BY_SAFETY", "FAILED"];
function isTerminal(status: string): boolean {
  return (TERMINAL as string[]).includes(status);
}

describe("hero image publish safety", () => {
  it("never auto-publishes a draft whose cover is still generating", () => {
    // heroIsPermanent is hardcoded false while the cover is PENDING. Publishing
    // then would put a post live with no cover and embed nothing in the body.
    expect(
      autoPublish({ claimsOk: true, requireReview: false, heroIsPermanent: false })
    ).toBe(false);
  });

  it("auto-publishes only once a permanent cover exists", () => {
    expect(
      autoPublish({ claimsOk: true, requireReview: false, heroIsPermanent: true })
    ).toBe(true);
  });

  it("keeps the claims gate dominant regardless of the cover", () => {
    // A permanent hero must never rescue a draft the claims gate blocked.
    expect(
      autoPublish({ claimsOk: false, requireReview: false, heroIsPermanent: true })
    ).toBe(false);
  });
});

describe("hero attach contract", () => {
  it("accepts only terminal states from the hero workflow", () => {
    expect(isTerminal("READY")).toBe(true);
    expect(isTerminal("BLOCKED_BY_SAFETY")).toBe(true);
    expect(isTerminal("FAILED")).toBe(true);
  });

  it("refuses PENDING as a reported outcome", () => {
    // PENDING is written by the drafter, never reported back. Accepting it
    // would let a run leave the asset stuck waiting on a cover forever.
    expect(isTerminal("PENDING")).toBe(false);
  });
});
