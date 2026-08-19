import type { Idea } from "@prisma/client";
import { DEFAULT_GENERATION_COST, UNSPECIFIED_TRADE } from "@/constants/config";
import type { AudienceLane, IdeaItem, IdeaStatus } from "@/types";

/**
 * The single Prisma-row -> wire-shape conversion for an idea.
 *
 * Previously three routes each had their own copy, and they disagreed about
 * `draft_asset_id` vs `draftAssetId`, whether `ideaId` was present, and whether
 * `priority` was emitted. Every /api/ideas response now goes through here.
 *
 * Note: the database column is still `draft_asset_id` (see the Prisma `@map`),
 * which is what the n8n workflows read and write. Only the JSON key changed.
 */
export function toIdeaDTO(idea: Idea): IdeaItem {
  return {
    id: idea.id,
    ideaId: idea.id,
    title: idea.rawIdea,
    raw_idea: idea.rawIdea,
    angle: idea.angle ?? "",
    excerpt: idea.angle || idea.why || "",
    audience: (idea.audience || "ICP") as AudienceLane,
    target_trade: idea.targetTrade || UNSPECIFIED_TRADE,
    pillar: idea.pillar,
    source: idea.source || "MANUAL",
    status: (idea.status || "HARVESTED") as IdeaStatus,
    priority: idea.priority ?? null,
    estimated_cost: DEFAULT_GENERATION_COST,
    tags: idea.tags ?? [],
    scheduled_for: idea.scheduledFor ? idea.scheduledFor.toISOString() : null,
    queue_order: idea.queueOrder ?? null,
    draftAssetId: idea.draftAssetId ?? null,
    created_at: idea.createdAt.toISOString(),
    updated_at: idea.updatedAt.toISOString(),
  };
}
