import { CONTENT_ANGLES } from "@/constants/contentAngles";

/**
 * What the strategist is told to do, decided in code (phase 4 of
 * docs/product/authority-flywheel-plan.md): the hook follows what the idea
 * rests on and the lane it serves. It used to be a substring match on the
 * pillar name ("myth", "architecture", ...), so every idea with an unmatched
 * pillar got the same scene-setting hook, whatever it was built on.
 */

export interface Hook {
  archetype: string;
  instruction: string;
}

const HOOKS = {
  AUTHOR_SCENE: {
    archetype: "AUTHOR SCENE",
    instruction: "Open inside the specific moment from the author's own experience given below, then reveal what was really going on. Use only details the experience states.",
  },
  WORK_IN_PROGRESS: {
    archetype: "WORK IN PROGRESS",
    instruction: "Open with what the author is working on right now and the one thing it is showing them. Present tense, concrete, no claims of results the experience does not state.",
  },
  POSITION: {
    archetype: "POSITION",
    instruction: "State the author's view in one plain sentence that a peer might disagree with, then give the reason. No hedging, no drama.",
  },
  THE_QUESTION: {
    archetype: "THE QUESTION",
    instruction: "Open with the question the reader keeps asking, in their own words, then give the author's direct answer in the next sentence.",
  },
  EXPERIMENT: {
    archetype: "WHAT WE ARE TESTING",
    instruction: "Open with what the author is testing and what the early signal says, clearly marked as early.",
  },
  WHAT_CHANGED: {
    archetype: "WHAT CHANGED",
    instruction: "Open with what changed and what it now means for the reader, not with the news itself.",
  },
  THE_DECISION: {
    archetype: "THE DECISION",
    instruction: "Open with the choice the reader is facing and the one criterion that should settle it.",
  },
  INVERSION: {
    archetype: "INVERSION",
    instruction: "Name a common assumption in this field, then what actually happens in practice, in two plain sentences. Thoughtful, never dramatic, and never the \"It isn't X, it's Y\" formula.",
  },
  DIRECT_COST: {
    archetype: "DIRECT COST",
    instruction: "Open with the concrete, immediate consequence of the wrong choice, stated plainly.",
  },
  READER_SCENE: {
    archetype: "READER SCENE",
    instruction: "Open inside a specific, recognizable moment the READER has lived, described the way a peer would mention it ('A lead calls at 9pm about the listing...'), never as an accusation ('Your X is failing'). Then say what is actually happening underneath it. Never present it as the author's own experience.",
  },
} satisfies Record<string, Hook>;

/** Legacy ideas (no source type or lane): by the exact angle, never a substring. */
const BY_ANGLE: Record<string, Hook> = {
  myth: HOOKS.INVERSION,
  counterintuitive: HOOKS.INVERSION,
  firstprinciples: HOOKS.INVERSION,
  stakes: HOOKS.DIRECT_COST,
  tradeoff: HOOKS.THE_DECISION,
  decision: HOOKS.THE_DECISION,
  shift: HOOKS.WHAT_CHANGED,
};

export function hookFor(input: { sourceType?: string | null; lanePurpose?: string | null; pillar?: string | null }): Hook {
  const { sourceType, lanePurpose, pillar } = input;
  switch (sourceType) {
    case "PAST_EXPERIENCE":
      return HOOKS.AUTHOR_SCENE;
    case "CURRENT_WORK":
    case "BUILD_IN_PUBLIC":
      return HOOKS.WORK_IN_PROGRESS;
    case "PROFESSIONAL_OPINION":
      return HOOKS.POSITION;
    case "EXPERIMENT":
      return HOOKS.EXPERIMENT;
    // The author's own note: open on their view, not on a scene the note may not contain.
    case "USER_NOTE":
      return HOOKS.POSITION;
  }
  // A lane that exists to help the reader choose opens on the choice.
  if (lanePurpose === "DEMAND") return HOOKS.THE_DECISION;
  if (sourceType === "ICP_QUESTION") return HOOKS.THE_QUESTION;
  if (sourceType === "MARKET_SIGNAL") return HOOKS.WHAT_CHANGED;
  const angle = CONTENT_ANGLES.find((a) => a.pillar === pillar);
  return (angle && BY_ANGLE[angle.id]) || HOOKS.READER_SCENE;
}

const CONTENT_MODES = ["INSIGHT", "STORY", "HOW_TO", "CASE_NOTE", "OPINION"] as const;
export type ContentMode = (typeof CONTENT_MODES)[number];

/**
 * STORY needs a story the author lived (or wrote down themselves); CASE_NOTE
 * needs a result someone can check. Without them those modes invite exactly
 * the invented anecdotes the claims gate exists to stop.
 */
export function allowedContentModes(trustBasis: string[]): ContentMode[] {
  const lived = trustBasis.includes("LIVED_EXPERIENCE") || trustBasis.includes("USER_NOTE");
  const proven = trustBasis.includes("APPROVED_PROOF") || trustBasis.includes("LIVED_EXPERIENCE");
  return CONTENT_MODES.filter((m) => (m === "STORY" ? lived : m === "CASE_NOTE" ? proven : true));
}

/** The strategist's pick, or the closest allowed mode when it picked one the evidence cannot carry. */
export function resolveContentMode(picked: unknown, trustBasis: string[]): ContentMode {
  const allowed = allowedContentModes(trustBasis);
  const mode = String(picked ?? "").toUpperCase() as ContentMode;
  if (allowed.includes(mode)) return mode;
  return mode === "STORY" ? "OPINION" : "INSIGHT";
}
