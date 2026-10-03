import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { confirmPulse, PulseError } from "@/services/pulse";

/**
 * Saves the items the author kept from this week's answer, then starts a
 * harvest so ideas from them arrive now.
 *
 *   POST { items: [{ kind, content, disclosure }] }   (an empty list keeps none)
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return apiFailure("Expected a JSON object.", 400);

  try {
    return NextResponse.json(await confirmPulse(ctx.clientId, body));
  } catch (error) {
    if (error instanceof PulseError) return apiFailure(error.message, error.status);
    return apiError(error, "Failed to save these items");
  }
}
