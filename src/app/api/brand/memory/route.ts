import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { toMemoryDTO } from "@/lib/mappers/author";
import { parseDisclosure, parseMemoryContent, parseMemoryKind } from "@/lib/authorInput";
import { blockingCodeFindings } from "@/lib/ai/memoryCheck";
import { MAX_MEMORY_ITEMS } from "@/constants/contentLanes";
import { usageCounts } from "@/services/memoryUsage";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const rows = await prisma.professionalMemory.findMany({
      where: { clientId: ctx.clientId },
      orderBy: { createdAt: "desc" },
    });
    const counts = await usageCounts(ctx.clientId, rows.map((r) => r.id));
    return NextResponse.json(rows.map((r) => toMemoryDTO(r, counts.get(r.id) ?? 0)));
  } catch (error) {
    return apiError(error, "Failed to load your experience");
  }
}

export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return apiFailure("Expected a JSON object.", 400);

    const kind = parseMemoryKind(body.kind);
    if (!kind) return apiFailure("Pick what kind of experience this is.", 400);
    const disclosure = parseDisclosure(body.disclosure);
    if (!disclosure) return apiFailure("disclosure must be PUBLIC or GENERALIZE.", 400);
    const content = parseMemoryContent(body.content);
    if (typeof content !== "string") return apiFailure(content.error, 400);

    // The floor that holds even if the page's check was skipped (decision D4).
    const blocked = blockingCodeFindings(content);
    if (blocked.length) return apiFailure(`Remove this before saving: ${blocked[0].reason}`, 400);

    const count = await prisma.professionalMemory.count({ where: { clientId: ctx.clientId } });
    if (count >= MAX_MEMORY_ITEMS) {
      return apiFailure(`You have ${MAX_MEMORY_ITEMS} items, the limit. Remove old ones first.`, 400);
    }

    const created = await prisma.professionalMemory.create({
      data: { clientId: ctx.clientId, kind, content, disclosure, source: "BRAND_PAGE" },
    });
    return NextResponse.json(toMemoryDTO(created), { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to save that experience");
  }
}
