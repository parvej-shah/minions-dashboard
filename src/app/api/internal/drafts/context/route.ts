import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { verifyWebhookSecret } from "@/lib/security";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { getDraftAuthorContext } from "@/services/draftContext";

/**
 * What 02_idea_to_asset needs to draft an idea as its author (phase 4 of
 * docs/product/authority-flywheel-plan.md): the idea's ICP problem and
 * advantage, the experience it rests on (GENERALIZE items as their lesson
 * only), the ICP, the author's standing, the hook and the content modes the
 * evidence allows.
 *
 *   POST { client_id, idea_id } -> { author: DraftAuthorContext }
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;
  await recordHeartbeat("02_idea_to_asset");

  const body = await request.json().catch(() => null);
  const clientId = typeof body?.client_id === "string" ? body.client_id.trim() : "";
  const ideaId = typeof body?.idea_id === "string" ? body.idea_id.trim() : "";
  if (!clientId || !ideaId) return apiFailure("client_id and idea_id are required", 400);

  try {
    return NextResponse.json({ author: await getDraftAuthorContext(clientId, ideaId) });
  } catch (error) {
    return apiError(error, "Failed to load the draft's author context");
  }
}
