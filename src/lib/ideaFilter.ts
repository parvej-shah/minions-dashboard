import { toIdeaStage, type IdeaStage } from "@/constants/ideaStage";
import type { IdeaItem } from "@/types";

export type StageFilter = "ALL" | IdeaStage;
export type IdeaOrder = "OLDEST" | "NEWEST";

const idOf = (idea: IdeaItem) => idea.ideaId || idea.id;
const createdAt = (idea: IdeaItem) => {
  const time = Date.parse(idea.created_at);
  return Number.isFinite(time) ? time : 0;
};

export function matchesQuery(idea: IdeaItem, query: string): boolean {
  const needle = query.toLowerCase();
  const haystacks = [idea.title || idea.raw_idea, idea.excerpt || idea.angle, idOf(idea), ...(idea.tags ?? [])];
  return haystacks.some((text) => (text ?? "").toLowerCase().includes(needle));
}

/** Ideas in the chosen stage that match the search text, oldest first by default (the order drafting picks them). */
export function filterIdeas(ideas: IdeaItem[], stage: StageFilter, query: string, order: IdeaOrder = "OLDEST"): IdeaItem[] {
  const text = query.trim();
  const direction = order === "NEWEST" ? -1 : 1;
  return ideas
    .filter((idea) => (stage === "ALL" || toIdeaStage(idea.status) === stage) && (!text || matchesQuery(idea, text)))
    .sort((a, b) => direction * (createdAt(a) - createdAt(b) || idOf(a).localeCompare(idOf(b))));
}

export function countByStage(ideas: IdeaItem[], stage: StageFilter): number {
  return stage === "ALL" ? ideas.length : ideas.filter((idea) => toIdeaStage(idea.status) === stage).length;
}
