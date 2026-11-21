import type { SourceType } from "@/constants/sourceMix";
import { hookFor } from "@/lib/drafts/strategy";

/** The tag on the ideas behind the extra posts a new workspace gets with its first one. */
export const STARTER_TAG = "Starter set";
/** Posts drafted beside the first one, so the dashboard opens with three. */
export const STARTER_COUNT = 2;

/**
 * A job one extra post does with the setup story. The three first posts used
 * to be the same story with a different angle note, and every one opened the
 * same way, because the opening follows the source type and they all copied
 * the story's. Each role now has its own focus and its own source type, so
 * its opening differs too (src/lib/drafts/strategy.ts hookFor).
 */
export interface StarterRole {
  id: "lesson" | "reader";
  pillar: string;
  brief: string;
  /** Tried in order; the first whose opening no other post in the set uses wins. */
  sourceTypes: SourceType[];
  /** The reader's-side post leaves out the author's story, so it cannot retell it. */
  keepsStory: boolean;
}

export const STARTER_ROLES: StarterRole[] = [
  {
    id: "lesson",
    pillar: "The Lesson",
    brief:
      "Another post already tells this story. Do not retell it and do not open on its moment. Argue the one lesson it taught, as the author's own view for the reader, and use the story at most as one sentence of evidence later in the post.",
    sourceTypes: ["PROFESSIONAL_OPINION", "PAST_EXPERIENCE"],
    keepsStory: true,
  },
  {
    id: "reader",
    pillar: "The Reader's Side",
    brief:
      "Two other posts already tell this story and its lesson. Do not retell the story, do not open on it, and do not write in the first person about it. Start from the reader's side: the moment they meet this same problem in their own work, then give practical steps they can use this week.",
    sourceTypes: ["ICP_QUESTION", "MARKET_SIGNAL"],
    keepsStory: false,
  },
];

export interface StarterPoolIdea {
  id: string;
  laneId: string | null;
  gateVerdict: string | null;
}

export type StarterPick =
  | { kind: "EXISTING"; ideaId: string }
  | { kind: "REFRAME"; role: StarterRole; sourceType: SourceType };

const openingOf = (sourceType: string | null | undefined) => hookFor({ sourceType }).archetype;

/**
 * Which extra posts a new workspace gets: harvested ideas that passed the gate,
 * one per lane so the angles differ, then the user's own story given another
 * job for whatever is left, each with an opening no other post in the set uses.
 */
export function pickStarterSet(pool: StarterPoolIdea[], firstSourceType: string | null = null, count: number = STARTER_COUNT): StarterPick[] {
  const picks: StarterPick[] = [];
  const seenIdeas = new Set<string>();
  const seenLanes = new Set<string | null>();
  for (const idea of pool) {
    if (picks.length >= count) break;
    if (idea.gateVerdict !== "PASS" || seenIdeas.has(idea.id) || seenLanes.has(idea.laneId)) continue;
    seenIdeas.add(idea.id);
    seenLanes.add(idea.laneId);
    picks.push({ kind: "EXISTING", ideaId: idea.id });
  }
  const usedOpenings = new Set([openingOf(firstSourceType)]);
  for (let i = 0; picks.length < count && i < STARTER_ROLES.length; i++) {
    const role = STARTER_ROLES[i];
    const sourceType = role.sourceTypes.find((t) => !usedOpenings.has(openingOf(t))) ?? role.sourceTypes[0];
    usedOpenings.add(openingOf(sourceType));
    picks.push({ kind: "REFRAME", role, sourceType });
  }
  return picks;
}
