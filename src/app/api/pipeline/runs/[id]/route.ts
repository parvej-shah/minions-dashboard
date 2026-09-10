import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/tenant";
import { verifyWebhookSecret } from "@/lib/security";
import { apiFailure } from "@/lib/api-response";

/**
 * A run is considered dead after this long with no terminal callback. n8n's own
 * draft path takes ~85s and harvest ~25s, so a run still RUNNING well past that
 * has lost its workflow -- the process died, or the callback never fired.
 *
 * Without this, a lost run stays RUNNING forever and the UI's progress HUD spins
 * indefinitely: every DRAFT run in production was RUNNING, including ones from
 * two weeks earlier, because the callback only ever fired on the success path.
 */
const RUN_TIMEOUT_MS = 10 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const run = await prisma.pipelineRun.findUnique({
    where: { id, clientId: ctx.clientId },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  // Report a lost run as failed rather than leaving the caller polling a status
  // that will never change. Persist it so every later reader agrees.
  if (run.status === "RUNNING" && Date.now() - run.createdAt.getTime() > RUN_TIMEOUT_MS) {
    const timedOut = await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        metadata: {
          ...((run.metadata as Record<string, unknown>) ?? {}),
          error: "The run stopped reporting progress and was marked failed.",
          timedOut: true,
        },
      },
    });
    return NextResponse.json(timedOut);
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

  const allowed = ["RUNNING", "COMPLETED", "FAILED"];
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
