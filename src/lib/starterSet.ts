import { CONTENT_ANGLES, type ContentAngle } from "@/constants/contentAngles";

/** The tag on the ideas behind the extra posts a new workspace gets with its first one. */
export const STARTER_TAG = "Starter set";
/** Posts drafted beside the first one, so the dashboard opens with three. */
export const STARTER_COUNT = 2;

// Angles that suit a real, lived story, in the order they are tried.
const STORY_ANGLE_IDS = ["postmortem", "counterintuitive", "myth", "decision"];

export interface StarterPoolIdea {
  id: string;
  laneId: string | null;
  gateVerdict: string | null;
}

export type StarterPick = { kind: "EXISTING"; ideaId: string } | { kind: "REFRAME"; angle: ContentAngle };

function storyAngles(): ContentAngle[] {
  return STORY_ANGLE_IDS.map((id) => CONTENT_ANGLES.find((angle) => angle.id === id)).filter((a): a is ContentAngle => Boolean(a));
}

/**
 * Which extra posts a new workspace gets: harvested ideas that passed the gate,
 * one per lane so the angles differ, then the user's own story told from
 * another angle for whatever is left.
 */
export function pickStarterSet(pool: StarterPoolIdea[], count: number = STARTER_COUNT): StarterPick[] {
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
  const angles = storyAngles();
  for (let i = 0; picks.length < count && i < angles.length; i++) picks.push({ kind: "REFRAME", angle: angles[i] });
  return picks;
}
