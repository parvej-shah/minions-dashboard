import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";

/**
 * Reports one source's fetch result back from 01_idea_harvester.
 *
 * `IdeaSource.lastFetchedAt`/`lastError` exist so the Sources tab can show a
 * dead feed instead of the harvester silently returning fewer ideas every run
 * -- but nothing ever wrote to them, so they sat null for every source
 * regardless of whether it was working. Called once per source item, right
 * after `RSS - Tenant Sources` / the Google News fetch, success or failure.
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const sourceId = typeof body.source_id === "string" ? body.source_id.trim() : "";
    if (!sourceId) return apiFailure("source_id is required", 400);

    const ok = body.ok !== false;
    const error = typeof body.error === "string" ? body.error.trim() : "";

    const updated = await prisma.ideaSource
      .update({
        where: { id: sourceId },
        data: {
          lastFetchedAt: new Date(),
          lastError: ok ? null : error || "Fetch failed",
        },
      })
      .catch(() => null);

    if (!updated) return apiFailure(`Unknown source_id: ${sourceId}`, 404);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to record source status");
  }
}
