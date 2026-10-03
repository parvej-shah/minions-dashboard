import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RUN_CALLBACK_STATUSES } from "@/constants/pipelineContracts";
import { sweepStaleRuns } from "@/lib/harvestBudget";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, notFound } from "@/server/http/errors";
import { dispatchPublish } from "@/services/pipeline";

export async function getPipelineRun(clientId: string, id: string) {
  await sweepStaleRuns();
  const run = await prisma.pipelineRun.findUnique({ where: { id, clientId } });
  if (!run) throw notFound("Run not found");
  return run;
}

export async function recordRunCallback(id: string, body: JsonObject) {
  const status = asString(body.status);
  const allowed: readonly string[] = RUN_CALLBACK_STATUSES;
  if (!allowed.includes(status)) throw badRequest(`status must be one of ${allowed.join(", ")}`);

  const existing = await prisma.pipelineRun.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Run not found");

  const metadata = body.metadata as Prisma.InputJsonValue | undefined;
  return prisma.pipelineRun.update({ where: { id }, data: { status, ...(metadata ? { metadata } : {}) } });
}

export async function startPublish(clientId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, clientId }, select: { id: true } });
  if (!asset) throw notFound("Draft not found");
  return dispatchPublish(asset.id, clientId);
}
