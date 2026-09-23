import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { toMemoryDTO } from "@/lib/mappers/author";
import { parseDisclosure, parseMemoryContent, parseMemoryKind } from "@/lib/authorInput";
import { blockingCodeFindings } from "@/lib/ai/memoryCheck";
import { usageCounts } from "@/services/memoryUsage";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const existing = await prisma.professionalMemory.findFirst({ where: { id, clientId: ctx.clientId } });
    if (!existing) return apiFailure("Experience item not found", 404);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return apiFailure("Expected a JSON object.", 400);

    const data: { kind?: string; content?: string; disclosure?: string; isActive?: boolean } = {};
    if (body.kind !== undefined) {
      const kind = parseMemoryKind(body.kind);
      if (!kind) return apiFailure("Unknown experience kind.", 400);
      data.kind = kind;
    }
    if (body.disclosure !== undefined) {
      const disclosure = parseDisclosure(body.disclosure);
      if (!disclosure) return apiFailure("disclosure must be PUBLIC or GENERALIZE.", 400);
      data.disclosure = disclosure;
    }
    if (body.content !== undefined) {
      const content = parseMemoryContent(body.content);
      if (typeof content !== "string") return apiFailure(content.error, 400);
      const blocked = blockingCodeFindings(content);
      if (blocked.length) return apiFailure(`Remove this before saving: ${blocked[0].reason}`, 400);
      data.content = content;
    }
    if (body.is_active !== undefined) data.isActive = body.is_active === true;

    const updated = await prisma.professionalMemory.update({ where: { id }, data });
    const counts = await usageCounts(ctx.clientId, [id]);
    return NextResponse.json(toMemoryDTO(updated, counts.get(id) ?? 0));
  } catch (error) {
    return apiError(error, "Failed to update that experience");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const { count } = await prisma.professionalMemory.deleteMany({ where: { id, clientId: ctx.clientId } });
    if (!count) return apiFailure("Experience item not found", 404);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Failed to delete that experience");
  }
}
