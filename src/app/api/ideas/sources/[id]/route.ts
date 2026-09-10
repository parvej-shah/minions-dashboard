import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { assertSafeFetchTarget } from "@/lib/ssrf-guard";
import {
  IDEA_SOURCE_KINDS,
  MAX_ITEMS_PER_SOURCE,
  resolveSourceFeedUrl,
} from "@/constants/ideaSources";
import { toIdeaSourceDTO } from "@/lib/mappers/ideaSource";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const existing = await prisma.ideaSource.findFirst({
      where: { id, clientId: ctx.clientId },
    });
    if (!existing) return apiFailure("Source not found", 404);

    const body = await request.json();
    const kind = body.kind !== undefined ? body.kind.toString() : existing.kind;
    const url = body.url !== undefined ? (body.url || "").toString().trim() || null : existing.url;
    const query = body.query !== undefined ? (body.query || "").toString().trim() || null : existing.query;

    const kindDef = IDEA_SOURCE_KINDS.find((k) => k.id === kind);
    if (!kindDef) return apiFailure("Unknown source kind.", 400);

    // Re-validate whenever anything that changes the fetch target moves.
    if (body.kind !== undefined || body.url !== undefined || body.query !== undefined) {
      const feedUrl = resolveSourceFeedUrl({ kind, url, query });
      if (!feedUrl) return apiFailure("Could not build a feed URL from that input.", 400);
      try {
        await assertSafeFetchTarget(feedUrl);
      } catch (e) {
        return apiFailure(e instanceof Error ? e.message : "That URL is not reachable.", 400);
      }
    }

    const updated = await prisma.ideaSource.update({
      where: { id },
      data: {
        kind,
        url,
        query,
        ...(body.label !== undefined ? { label: body.label.toString().trim() || existing.label } : {}),
        ...(body.max_items !== undefined
          ? { maxItems: Math.min(Math.max(Number(body.max_items) || 5, 1), MAX_ITEMS_PER_SOURCE) }
          : {}),
        ...(body.is_active !== undefined ? { isActive: body.is_active === true } : {}),
        // A successful edit clears a stale fetch error so the row stops
        // showing a failure the operator has just fixed.
        ...(body.url !== undefined || body.query !== undefined ? { lastError: null } : {}),
      },
    });

    return NextResponse.json(toIdeaSourceDTO(updated));
  } catch (error) {
    return apiError(error, "Failed to update idea source");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const deleted = await prisma.ideaSource.deleteMany({
      where: { id, clientId: ctx.clientId },
    });
    if (deleted.count === 0) return apiFailure("Source not found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete idea source");
  }
}
