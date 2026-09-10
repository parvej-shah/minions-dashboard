import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { assertSafeFetchTarget } from "@/lib/ssrf-guard";
import {
  IDEA_SOURCE_KINDS,
  MAX_ITEMS_PER_SOURCE,
  MAX_SOURCES_PER_TENANT,
  resolveSourceFeedUrl,
  type IdeaSourceKind,
} from "@/constants/ideaSources";
import { toIdeaSourceDTO } from "@/lib/mappers/ideaSource";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const rows = await prisma.ideaSource.findMany({
      where: { clientId: ctx.clientId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(rows.map(toIdeaSourceDTO));
  } catch (error) {
    return apiError(error, "Failed to fetch idea sources");
  }
}

export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const kind = (body.kind || "RSS").toString() as IdeaSourceKind;
    const label = (body.label || "").toString().trim();
    const url = (body.url || "").toString().trim() || null;
    const query = (body.query || "").toString().trim() || null;

    const kindDef = IDEA_SOURCE_KINDS.find((k) => k.id === kind);
    if (!kindDef) return apiFailure("Unknown source kind.", 400);
    if (!label) return apiFailure("label is required", 400);
    if (kindDef.usesQuery && !query) {
      return apiFailure(`A ${kindDef.label} needs a topic.`, 400);
    }
    if (!kindDef.usesQuery && !url) {
      return apiFailure(`A ${kindDef.label} needs a feed URL.`, 400);
    }

    const count = await prisma.ideaSource.count({ where: { clientId: ctx.clientId } });
    if (count >= MAX_SOURCES_PER_TENANT) {
      return apiFailure(
        `You have reached the limit of ${MAX_SOURCES_PER_TENANT} sources. Remove one before adding another.`,
        400
      );
    }

    // The harvester fetches this URL server-side, so validate it here rather
    // than letting an operator point a feed at internal infrastructure.
    const feedUrl = resolveSourceFeedUrl({ kind, url, query });
    if (!feedUrl) return apiFailure("Could not build a feed URL from that input.", 400);
    try {
      await assertSafeFetchTarget(feedUrl);
    } catch (e) {
      return apiFailure(e instanceof Error ? e.message : "That URL is not reachable.", 400);
    }

    const maxItems = Math.min(
      Math.max(Number(body.max_items) || 5, 1),
      MAX_ITEMS_PER_SOURCE
    );

    const created = await prisma.ideaSource.create({
      data: {
        clientId: ctx.clientId,
        kind,
        label,
        url,
        query,
        maxItems,
        isActive: body.is_active !== false,
      },
    });

    return NextResponse.json(toIdeaSourceDTO(created), { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create idea source");
  }
}
