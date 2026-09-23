import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { runDraftCheck } from "@/services/draftCheck";

/**
 * The draft check for 02_idea_to_asset (src/lib/drafts/check.ts): claims,
 * invented figures, Generalize leaks, first-person claims without experience,
 * and readability. Replaced the claims gate in the Parse Claims and Gate node.
 *
 *   POST { client_id, idea_id, hook, body, claims, evidence_block, brand_context }
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return apiFailure("Body must be a JSON object", 400);

  try {
    const result = await runDraftCheck(body as Record<string, unknown>);
    if ("error" in result) return apiFailure(result.error, 400);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, "Failed to check the draft");
  }
}
