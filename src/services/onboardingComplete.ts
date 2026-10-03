import { prisma } from "@/lib/prisma";
import { DEFAULT_CADENCE } from "@/lib/scheduling";
import { dispatchRun } from "@/services/pipeline";

// Without a PostingSchedule a self-served workspace is invisible to 00b until someone opens Settings > Schedule.
// Upsert, so re-running onboarding never clobbers a schedule the tenant customized.
async function ensurePostingSchedule(clientId: string) {
  await prisma.postingSchedule.upsert({
    where: { clientId },
    update: { isActive: true },
    create: { clientId, ...DEFAULT_CADENCE, requireReview: true, isActive: true },
  });
}

export async function startFirstHarvest(clientId: string) {
  const run = await prisma.pipelineRun.create({ data: { clientId, type: "HARVEST", status: "RUNNING" } });
  await ensurePostingSchedule(clientId);

  const { result, status } = await dispatchRun(
    "harvest",
    run.id,
    { client_id: clientId, trigger_source: "ONBOARDING_COMPLETE" },
    {
      failure: "Onboarding is saved, but the first harvest run didn't start automatically",
      success: "Your first ideas are on the way. This can take a minute or two.",
    }
  );
  return { result, status, runId: run.id };
}
