import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/utils/date";
import { PIPELINE_AGENTS } from "@/constants/fleet";
import type { AgentWorkerItem } from "@/types";

const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The pipeline fleet: the n8n stage registry composed with real throughput.
 *
 * The stage list itself lives in `constants/fleet.ts` and mirrors the live n8n
 * workflows. Everything time-varying — run totals, last activity, status — is
 * counted here from Prisma, so no figure on the Fleet page is invented.
 *
 * The two `01_idea_harvester` stages run in sequence on every harvest, so both
 * are counted in ideas the pipeline produced (anything not entered by hand).
 * The five `02_idea_to_asset` stages likewise run in a straight line per idea
 * claimed, so an asset row is one run of each of them.
 */
export async function getPipelineFleet(clientId: string): Promise<AgentWorkerItem[]> {
  const [harvestedIdeas, totalAssets, latestIdea, latestAsset] = await Promise.all([
    prisma.idea.count({ where: { clientId, source: { not: "MANUAL" } } }),
    prisma.asset.count({ where: { clientId } }),
    prisma.idea.findFirst({
      where: { clientId, source: { not: "MANUAL" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.asset.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const lastRunAt = {
    IDEAS: latestIdea?.createdAt ?? null,
    ASSETS: latestAsset?.createdAt ?? null,
  };
  const totals = { IDEAS: harvestedIdeas, ASSETS: totalAssets };

  return PIPELINE_AGENTS.map((agent) => {
    const ranAt = lastRunAt[agent.countBasis];

    // No per-run heartbeat is recorded, so "active" is inferred from recency of
    // the last real run of that workflow rather than hardcoded true.
    const isRecentlyActive = ranAt ? Date.now() - ranAt.getTime() < ACTIVE_WINDOW_MS : false;

    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      type: agent.type,
      model: agent.model,
      status: isRecentlyActive ? "ACTIVE" : "IDLE",
      system_prompt: agent.systemPrompt,
      last_active: ranAt ? formatRelativeTime(ranAt.toISOString()) : "No runs yet",
      total_runs: totals[agent.countBasis],
      workflow: agent.workflow,
      node: agent.node,
      provider: agent.provider,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      runs_unit: agent.runsUnit,
    } satisfies AgentWorkerItem;
  });
}
