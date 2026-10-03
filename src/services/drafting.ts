import { prisma } from "@/lib/prisma";
import { dispatchRun } from "@/services/pipeline";
import { claimRunSlot } from "@/lib/harvestBudget";
import { conflict, HttpError, notFound } from "@/server/http/errors";

interface DraftRunOptions {
  title?: unknown;
  audience?: unknown;
  target_trade?: unknown;
  triggerSource?: string;
}

async function assertIdeaDraftable(clientId: string, ideaId: string) {
  const [idea, existingAsset] = await Promise.all([
    prisma.idea.findFirst({ where: { id: ideaId, clientId }, select: { id: true, draftAssetId: true, status: true } }),
    prisma.asset.findFirst({ where: { ideaId, clientId }, select: { id: true } }),
  ]);
  if (!idea) throw notFound(`Idea ${ideaId} does not exist.`);

  const assetId = existingAsset?.id ?? idea.draftAssetId;
  if (assetId) {
    throw conflict(`This idea already has a draft (asset ${assetId}). Delete that asset first if you want to draft it again.`);
  }
  if (idea.status === "PICKED") {
    throw conflict(
      "A drafting run already claimed this idea and is still working on it. Wait for it to finish, or reset the claim from the Idea Stream."
    );
  }
}

// Drafting is the expensive half of the pipeline, so its daily budget is tighter than harvesting's.
export async function startDraftRun(clientId: string, ideaId: string | null, extra: DraftRunOptions = {}) {
  const triggerSource = extra.triggerSource ?? "MINIONS_COCKPIT_EDITORIAL";
  if (ideaId) await assertIdeaDraftable(clientId, ideaId);

  const slot = await claimRunSlot("DRAFT", clientId, { trigger_source: triggerSource, idea_id: ideaId });
  if (!slot.granted) {
    const message = `Daily drafting limit reached (${slot.budget.limit} runs across all tenants). The next window opens at 00:00 UTC.`;
    throw new HttpError(429, message, { success: false, message, budget: slot.budget });
  }

  const { result, status } = await dispatchRun(
    "draft",
    slot.runId,
    {
      client_id: clientId,
      idea_id: ideaId,
      title: extra.title ?? null,
      audience: extra.audience ?? null,
      trade: extra.target_trade ?? null,
      trigger_source: triggerSource,
    },
    {
      failure: "The drafting pipeline did not accept the request. Check that 02_idea_to_asset is active in n8n",
      success: "Drafting run started. The finished draft appears in the Editorial Studio in about a minute.",
    }
  );
  return { status, result, runId: slot.runId, budget: slot.budget };
}
