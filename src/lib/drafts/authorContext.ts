import type { IcpContext } from "@/services/authorContext";
import { allowedContentModes, hookFor, type ContentMode, type Hook } from "./strategy";

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
}

/** Plain-language evidence rules for this draft, from its trust basis. */
export function evidenceRules(ctx: Pick<DraftAuthorContext, "trust_basis" | "memory">): string[] {
  const t = ctx.trust_basis;
  const rules: string[] = [];
  if (t.includes("LIVED_EXPERIENCE") && ctx.memory.length) {
    rules.push("You may write in the first person about the AUTHOR'S EXPERIENCE listed, and only about that. Use its details as stated; never add events, numbers, clients or results it does not state.");
  } else if (t.includes("USER_NOTE")) {
    rules.push("The idea is the author's own note. You may use what the note says, and nothing more in the first person.");
  } else {
    rules.push("There is no author experience behind this idea: never write first-person experience, clients or results ('we built', 'I saw', 'one of our clients'). Write analysis and opinion.");
  }
  if (t.includes("APPROVED_PROOF")) rules.push("Verified proof may be stated as fact, in its own wording.");
  if (t.includes("MARKET_SIGNAL")) rules.push("Supplied sources may be cited for exactly what their excerpts say.");
  rules.push("Any number, result or fact not in the experience, proof or supplied sources is invented: leave it out. An illustrative example stays illustrative, without made-up precision.");
  rules.push("Items marked GENERALIZE are already stripped of names, places and figures; do not add any back.");
  return rules;
}

export function emptyDraftContext(icp: IcpContext, writerStanding: string, pillar?: string | null): DraftAuthorContext {
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
    hook: hookFor({ pillar }),
    allowed_modes: allowedContentModes([]),
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
  writerStanding: string
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
    hook: hookFor({ sourceType: idea.sourceType, lanePurpose: lane?.purpose, pillar: idea.pillar }),
    allowed_modes: allowedContentModes(trust),
  };
}
