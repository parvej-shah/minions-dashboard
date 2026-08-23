import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/tenant";

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

  return NextResponse.json(run);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // This endpoint is called by n8n. In a real system, we might protect it with a secret.
  // Since n8n is internal infrastructure, we just update the run.
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, metadata } = body;

  const run = await prisma.pipelineRun.update({
    where: { id },
    data: {
      status,
      ...(metadata ? { metadata } : {}),
    },
  });

  return NextResponse.json(run);
}
