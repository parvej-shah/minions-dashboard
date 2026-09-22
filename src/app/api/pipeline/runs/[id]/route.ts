import { NextResponse } from "next/server";
import { RUN_CALLBACK_STATUSES } from "@/constants/pipelineContracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/tenant";
import { verifyWebhookSecret } from "@/lib/security";
import { apiFailure } from "@/lib/api-response";
import { sweepStaleRuns } from "@/lib/harvestBudget";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;

  // Report a lost run as failed rather than leaving the caller polling a status
  // that will never change. Sweeps every stale run, not just this one -- see
  // `sweepStaleRuns` for why relying solely on whoever polls this id isn't enough.
  await sweepStaleRuns();

  const run = await prisma.pipelineRun.findUnique({
    where: { id, clientId: ctx.clientId },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json(run);
}

/**
 * Terminal-state callback from n8n.
 *
 * This previously had no authentication at all -- the comment read "since n8n is
 * internal infrastructure, we just update the run" -- so any caller who guessed
 * a cuid could mark another tenant's run COMPLETED and make the Cockpit claim a
 * draft was ready that does not exist. It now requires the same webhook secret
 * every other n8n-called route does.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, metadata } = body as {
    status?: string;
    metadata?: Record<string, unknown>;
  };

  const allowed: readonly string[] = RUN_CALLBACK_STATUSES;
  if (!status || !allowed.includes(status)) {
    return apiFailure(`status must be one of ${allowed.join(", ")}`, 400);
  }

  const existing = await prisma.pipelineRun.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return apiFailure("Run not found", 404);
  }

  const run = await prisma.pipelineRun.update({
    where: { id },
    data: {
      status,
      ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });

  return NextResponse.json(run);
}
