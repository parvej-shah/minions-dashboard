import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { verifyWebhookSecret } from "@/lib/security";
import { scrubBannedWords } from "@/services/bannedScrub";

export const maxDuration = 120;

/**
 * 02_idea_to_asset › Scrub Banned Words, just before Prepare Asset Row:
 * rewrites the sentences that use one of the tenant's FORBIDDEN words.
 *
 *   POST { client_id, texts: { body, hook, li_variant, ... } }
 *   -> { texts, rewritten, kept, remaining }
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const body = (await request.json().catch(() => null)) as { client_id?: unknown; texts?: unknown } | null;
  const clientId = typeof body?.client_id === "string" ? body.client_id : "";
  const raw = body?.texts && typeof body.texts === "object" && !Array.isArray(body.texts) ? (body.texts as Record<string, unknown>) : null;
  if (!clientId || !raw) return apiFailure("client_id and texts are required", 400);
  const texts = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v : ""]));

  try {
    return NextResponse.json(await scrubBannedWords(clientId, texts));
  } catch (error) {
    return apiError(error, "Failed to scrub banned words");
  }
}
