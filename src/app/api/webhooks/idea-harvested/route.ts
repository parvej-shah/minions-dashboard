import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSecret } from "@/lib/security";
import { thesisKey } from "@/lib/thesis";

/**
 * Ingests one harvested idea from 01_idea_harvester.
 *
 * `client_id` is required. It used to be omitted entirely, so every idea
 * arriving here landed with a NULL `clientId` -- invisible to the tenant
 * whose harvest produced it, and unreachable by every clientId-scoped query
 * in the dashboard. Rejecting the write is better than silently creating
 * another orphan row.
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) {
    return authCheck.response;
  }

  try {
    const body = await request.json();

    const clientId = (body.client_id || body.clientId || "").toString().trim();
    if (!clientId) {
      return apiFailure("client_id is required", 400);
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) {
      return apiFailure(`Unknown client_id: ${clientId}`, 404);
    }

    const rawIdea = (body.title || body.raw_idea || body.rawIdea || "Untitled Signal").toString();
    const angle = (body.angle || body.excerpt || "Strategic trade thesis").toString();

    const data = {
      rawIdea,
      angle,
      targetTrade: body.trade || body.target_trade || body.targetTrade || "HVAC",
      audience: body.audience || "ICP",
      pillar: body.pillar || "Contractor Realities",
      source: body.source || "GOOGLE_TRENDS",
      priority: body.priority || "HIGH",
      tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : [],
      sourceUrl: body.source_url || body.sourceUrl || null,
      sourceTitle: body.source_title || body.sourceTitle || null,
      // "Steal like an artist": the structural lesson drawn from the source
      // piece, never its wording. Paired with craftSourceUrl for attribution.
      craftNotes: body.craft_notes || body.craftNotes || null,
      craftSourceUrl: body.craft_source_url || body.craftSourceUrl || null,
      // Fingerprint of the claim, so the next harvest can tell a genuinely
      // new idea from a reworded restatement of this one.
      thesisKey: thesisKey(rawIdea, angle),
    };

    // Per-tenant sequence. The previous global `prisma.idea.count()` both
    // leaked one tenant's volume into another's ID space and raced: two
    // concurrent harvests read the same count and generated the same ID,
    // so the second silently upserted over the first's idea.
    const ideaId = (body.ideaId || body.id || "").toString().trim() || (await nextIdeaId(clientId));

    const created = await prisma.idea.upsert({
      where: { id: ideaId },
      update: { ...data, clientId },
      create: {
        id: ideaId,
        clientId,
        ...data,
        status: "HARVESTED",
        icpRelevance: Number(body.icp_relevance) || 90,
      },
    });

    return NextResponse.json({ success: true, idea: created }, { status: 201 });
  } catch (error) {
    return apiError(error, "Webhook processing failed");
  }
}

/**
 * Next free `IDEA-<n>` for one tenant, derived from that tenant's highest
 * existing number rather than a global row count. Retries on the unique-ID
 * collision two simultaneous harvests can still produce.
 */
async function nextIdeaId(clientId: string): Promise<string> {
  const rows = await prisma.idea.findMany({
    where: { clientId },
    select: { id: true },
  });

  let max = 0;
  for (const row of rows) {
    const match = /^IDEA-(\d+)$/.exec(row.id);
    if (match) max = Math.max(max, Number(match[1]));
  }

  return `IDEA-${String(max + 1).padStart(4, "0")}`;
}
