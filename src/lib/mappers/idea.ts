import type { Prisma } from "@prisma/client";
import { DEFAULT_GENERATION_COST, UNSPECIFIED_TRADE } from "@/constants/config";
import type { AudienceLane, GateVerdict, IdeaAuthority, IdeaItem, IdeaSignal, IdeaStatus } from "@/types";

export const ideaDTOSelect = {
  id: true, rawIdea: true, angle: true, audience: true, targetTrade: true,
  pillar: true, source: true, sourceUrl: true, sourceTitle: true, signals: true,
  why: true, status: true, priority: true, tags: true, scheduledFor: true,
  queueOrder: true, draftAssetId: true, rejectionReason: true, gateVerdict: true,
  gateReasons: true, scoreBreakdown: true, icpProblem: true, authorAdvantage: true,
  sourceType: true, trustBasis: true, memoryIds: true, createdAt: true, updatedAt: true,
} satisfies Prisma.IdeaSelect;

type IdeaDTORecord = Prisma.IdeaGetPayload<{ select: typeof ideaDTOSelect }>;

function toAuthority(idea: IdeaDTORecord): IdeaAuthority | null {
  if (!idea.gateVerdict) return null;
  const breakdown = idea.scoreBreakdown as { score?: unknown } | null;
  return {
    verdict: idea.gateVerdict as GateVerdict,
    reasons: idea.gateReasons ?? [],
    score: typeof breakdown?.score === "number" ? breakdown.score : null,
    icp_problem: idea.icpProblem ?? null,
    author_advantage: idea.authorAdvantage ?? null,
    source_type: idea.sourceType ?? null,
    trust_basis: idea.trustBasis ?? [],
    memory_ids: idea.memoryIds ?? [],
  };
}

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
export function toIdeaDTO(idea: IdeaDTORecord): IdeaItem {
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
    source_url: idea.sourceUrl ?? null,
    source_title: idea.sourceTitle ?? null,
    signals: Array.isArray(idea.signals) ? (idea.signals as unknown as IdeaSignal[]) : [],
    why: idea.why ?? null,
    status: (idea.status || "HARVESTED") as IdeaStatus,
    priority: idea.priority ?? null,
    estimated_cost: DEFAULT_GENERATION_COST,
    tags: idea.tags ?? [],
    scheduled_for: idea.scheduledFor ? idea.scheduledFor.toISOString() : null,
    queue_order: idea.queueOrder ?? null,
    draftAssetId: idea.draftAssetId ?? null,
    rejection_reason: idea.rejectionReason ?? null,
    authority: toAuthority(idea),
    created_at: idea.createdAt.toISOString(),
    updated_at: idea.updatedAt.toISOString(),
  };
}
