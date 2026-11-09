/**
 * The Ideas list (task 25): which ideas are up next, being written, written or
 * set aside, and in what order. "Up next" follows the content plan: the idea
 * planned for the soonest posting time comes first, the rest oldest first.
 */
import { toIdeaStage } from "@/constants/ideaStage";
import { getSourceTag, MANUAL_SOURCE_LABEL } from "@/constants/ideaBadges";
import { matchesQuery } from "@/lib/ideaFilter";
import type { IdeaItem } from "@/types";

export type IdeaGroup = "next" | "writing" | "written" | "aside";
export type IdeaView = "next" | "written" | "aside";

export function ideaGroup(idea: IdeaItem): IdeaGroup {
  if (idea.draftAssetId) return "written";
  switch (toIdeaStage(idea.status)) {
    case "DRAFTING":
      return "writing";
    case "DRAFTED":
    case "PUBLISHED":
      return "written";
    case "ARCHIVED":
      return "aside";
    default:
      return "next";
  }
}

export interface PlannedSlot {
  idea_id: string | null;
  slot_at: string;
}

export interface ListedIdea {
  idea: IdeaItem;
  /** The posting time the plan holds this idea for, if any. */
  slotAt: string | null;
}

const time = (iso: string | null | undefined) => {
  const t = Date.parse(iso ?? "");
  return Number.isFinite(t) ? t : 0;
};

export function ideasFor(ideas: IdeaItem[], view: IdeaView, plan: PlannedSlot[], query: string): ListedIdea[] {
  const slotOf = new Map<string, string>();
  for (const s of [...plan].sort((a, b) => time(a.slot_at) - time(b.slot_at))) {
    if (s.idea_id && !slotOf.has(s.idea_id)) slotOf.set(s.idea_id, s.slot_at);
  }
  const text = query.trim();
  const listed = ideas
    .filter((i) => ideaGroup(i) === view && (!text || matchesQuery(i, text)))
    .map((idea) => ({ idea, slotAt: view === "next" ? slotOf.get(idea.id) ?? slotOf.get(idea.ideaId) ?? null : null }));

  return listed.sort((a, b) => {
    if (view !== "next") return time(b.idea.updated_at ?? b.idea.created_at) - time(a.idea.updated_at ?? a.idea.created_at);
    if (a.slotAt && b.slotAt) return time(a.slotAt) - time(b.slotAt);
    if (a.slotAt || b.slotAt) return a.slotAt ? -1 : 1;
    return time(a.idea.created_at) - time(b.idea.created_at) || a.idea.id.localeCompare(b.idea.id);
  });
}

export function countIdeas(ideas: IdeaItem[], group: IdeaGroup): number {
  return ideas.filter((i) => ideaGroup(i) === group).length;
}

const NAMED = new Set(["TechCrunch AI", "Hacker News", "n8n Blog", "Reddit", "Industry Signals"]);

/** "Your own idea", "From Reddit ↗", "From your brand", or "From an article ↗". */
export function sourceLine(idea: IdeaItem): { text: string; href?: string } {
  const label = getSourceTag(idea.source || "MANUAL").label;
  const href = idea.source_url || undefined;
  if (label === MANUAL_SOURCE_LABEL) return { text: "Your own idea" };
  if (label === "Brand Core") return { text: "From your brand", href };
  if (NAMED.has(label)) return { text: `From ${label}`, href };
  return href ? { text: "From an article", href } : { text: "Found by Minions" };
}
