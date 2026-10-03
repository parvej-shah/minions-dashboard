import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { startDraftRun } from "@/services/drafting";

/** Triggers the live 02_idea_to_asset workflow in n8n. See `startDraftRun`. */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const ideaId = (body.idea_id as string | null) ?? null;

  try {
    const run = await startDraftRun(ctx.clientId, ideaId, body);
    if (!run.ok) {
      return run.status === 429
        ? NextResponse.json({ success: false, message: run.error, budget: run.budget }, { status: 429 })
        : apiFailure(run.error, run.status);
    }
    return NextResponse.json(
      { ...run.result, requested_idea_id: ideaId, run_id: run.runId, budget: run.budget },
      { status: run.status }
    );
  } catch (error) {
    return apiError(error, "Draft trigger failed");
  }
}
