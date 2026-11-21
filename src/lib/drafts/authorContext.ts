import type { IcpContext } from "@/services/authorContext";
import { allowedContentModes, hookFor, type CloseKind, type ContentMode, type Hook } from "./strategy";

/**
 * Everything the strategist, writer and editor need to write an idea as THIS
 * author (phase 4): what the idea rests on, the author's experience with
 * disclosure applied, the ICP, and what evidence the draft may use. Served to
 * 02_idea_to_asset by POST /api/internal/drafts/context.
 */
export interface DraftMemory {
  kind: string;
  /** For GENERALIZE items, the lesson only: never the original text. */
  text: string;
  disclosure: "PUBLIC" | "GENERALIZE";
}

export interface DraftAuthorContext {
  /** False for an idea from before phase 3, or one not found for this workspace: the draft proceeds as before. */
  found: boolean;
  source_type: string | null;
  trust_basis: string[];
  icp_problem: string;
  reader_context: string;
  author_advantage: string;
  white_space: string;
  fresh_perspective: string;
  vision: string | null;
  recommended_format: "POST" | "ARTICLE";
  lane: { name: string; purpose: string; brief: string } | null;
  memory: DraftMemory[];
  icp: IcpContext;
  /** The author's standing in their field: what they may claim and how assertively. */
  writer_standing: string;
  hook: Hook;
  allowed_modes: ContentMode[];
  /** The arguments of the author's last few posts, so this one does not repeat them. */
  recent_posts?: string[];
  /** The first lines of the author's last few posts, so this one opens differently (task 113). */
  recent_openings?: string[];
  /** The body shape this post should take, rotated by post count (task 113 phase 4). Absent for the starter set. */
  mode_hint?: ContentMode;
  /** How this post ends, rotated by post count. Absent for the starter set. */
  close?: CloseKind;
}

/** Plain-language evidence rules for this draft, from its trust basis. */
export function evidenceRules(ctx: Pick<DraftAuthorContext, "trust_basis" | "memory">): string[] {
  const t = ctx.trust_basis;
  const rules: string[] = [];
  if (t.includes("LIVED_EXPERIENCE") && ctx.memory.length) {
    rules.push("You may write in the first person about the AUTHOR'S EXPERIENCE listed, and only about that. Use its details as stated; never add events, numbers, clients or results it does not state.");
  } else if (t.includes("USER_NOTE")) {
    rules.push("The idea is the author's own note. You may use what the note says, and nothing more in the first person. Call things what the note calls them: name the tools, products and people it names instead of a generic stand-in ('a classifier'), and keep each figure's exact sense (a median stays a median).");
  } else {
    // The fallback when the experience bank has nothing for this idea: still the
    // author's own view, never a neutral explainer, and never invented experience.
    rules.push("There is no author experience behind this idea, so write it as the author's take: first person is welcome for what the author thinks, would check or recommends ('I think', 'what I'd look at first', 'I'm not sure yet'), never for events, clients, builds or results ('we built', 'I saw', 'one of our clients'). Credit what a source says to the source, and tie the point to the author's goal and the ICP's problem.");
  }
  if (t.includes("APPROVED_PROOF")) rules.push("Verified proof may be stated as fact, in its own wording.");
  if (t.includes("MARKET_SIGNAL")) rules.push("Supplied sources may be cited for exactly what their excerpts say.");
  rules.push("Any number, result or fact not in the experience, proof or supplied sources is invented: leave it out. An illustrative example stays illustrative, without made-up precision.");
  rules.push("Items marked GENERALIZE are already stripped of names, places and figures; do not add any back.");
  return rules;
}

export function emptyDraftContext(icp: IcpContext, writerStanding: string, pillar?: string | null, turn = 0): DraftAuthorContext {
  return {
    found: false,
    source_type: null,
    trust_basis: [],
    icp_problem: "",
    reader_context: "",
    author_advantage: "",
    white_space: "",
    fresh_perspective: "",
    vision: null,
    recommended_format: "ARTICLE",
    lane: null,
    memory: [],
    icp,
    writer_standing: writerStanding,
    hook: hookFor({ pillar }, turn),
    allowed_modes: allowedContentModes([]),
  };
}

/**
 * The note on an idea the author added themselves ("Add your own idea"): what
 * they wrote is their own account, so the draft may use it in the first
 * person, figures and names included. Null for any other idea, or one with
 * only a title. A gated idea carries its note in its trust basis instead.
 */
export function manualIdeaNote(idea: { source: string | null; gateVerdict: string | null; rawIdea: string; angle: string | null; why: string | null }): string | null {
  if (idea.source !== "MANUAL" || idea.gateVerdict) return null;
  const notes = [idea.angle, idea.why].map((s) => s?.trim()).filter(Boolean);
  return notes.length ? [idea.rawIdea.trim(), ...notes].join("\n") : null;
}

/** The context for a manual idea's note: the note is the author's experience item, and the only one. */
export function noteDraftContext(note: string, icp: IcpContext, writerStanding: string, lane: DraftAuthorContext["lane"], turn = 0): DraftAuthorContext {
  const trust = ["USER_NOTE"];
  return {
    ...emptyDraftContext(icp, writerStanding),
    found: true,
    source_type: "USER_NOTE",
    trust_basis: trust,
    author_advantage: "The author's own account in their note below.",
    recommended_format: "POST",
    lane,
    memory: [{ kind: "NOTE", disclosure: "PUBLIC", text: note }],
    hook: hookFor({ sourceType: "USER_NOTE" }, turn),
    allowed_modes: allowedContentModes(trust),
  };
}

/** The stored idea fields the draft context is built from (camelCase, as Prisma returns them). */
export interface DraftIdeaFields {
  sourceType: string | null;
  trustBasis: string[];
  icpProblem: string | null;
  readerContext: string | null;
  authorAdvantage: string | null;
  whiteSpace: string | null;
  freshPerspective: string | null;
  vision: string | null;
  recommendedFormat: string | null;
  pillar: string | null;
}

/**
 * Builds the context from an idea and its (active, disclosure-applied) memory.
 * Pure, so the eval builds exactly what production serves.
 */
export function buildDraftAuthorContext(
  idea: DraftIdeaFields,
  memory: DraftMemory[],
  icp: IcpContext,
  lane: { name: string; purpose: string; brief: string } | null,
  writerStanding: string,
  /** The workspace's post count: walks the opening list (src/lib/drafts/strategy.ts hookFor). */
  turn = 0
): DraftAuthorContext {
  // A cited item since removed or switched off no longer backs the draft.
  const trust = idea.trustBasis.filter((t) => t !== "LIVED_EXPERIENCE" || memory.length > 0);
  const hasAdvantage = memory.length > 0 || trust.includes("APPROVED_PROOF") || trust.includes("USER_NOTE");
  return {
    found: true,
    source_type: idea.sourceType,
    trust_basis: trust,
    icp_problem: idea.icpProblem ?? "",
    reader_context: idea.readerContext ?? "",
    author_advantage: hasAdvantage ? idea.authorAdvantage ?? "" : "",
    white_space: idea.whiteSpace ?? "",
    fresh_perspective: idea.freshPerspective ?? "",
    vision: idea.vision,
    recommended_format: idea.recommendedFormat === "POST" ? "POST" : "ARTICLE",
    lane,
    memory,
    icp,
    writer_standing: writerStanding,
    hook: hookFor({ sourceType: idea.sourceType, lanePurpose: lane?.purpose, pillar: idea.pillar, lived: trust.includes("LIVED_EXPERIENCE") }, turn),
    allowed_modes: allowedContentModes(trust),
  };
}
