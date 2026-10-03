import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { answerPulse, getPulse, PulseError, skipPulse, snoozePulse } from "@/services/pulse";

// The answer is turned into items by a model call and each item is checked.
export const maxDuration = 90;

/** This week's question, for the home card and the sidebar badge. */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;
  try {
    return NextResponse.json(await getPulse(ctx.clientId));
  } catch (error) {
    return apiError(error, "Failed to load this week's question");
  }
}

/**
 *   POST { action: "answer", answer, followups? }  -> proposed items to confirm
 *   POST { action: "snooze" }                      -> until tomorrow
 *   POST { action: "skip" }                        -> not this week
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return apiFailure("Expected a JSON object.", 400);

  try {
    if (body.action === "answer") return NextResponse.json(await answerPulse(ctx.clientId, body));
    if (body.action === "snooze") return NextResponse.json(await snoozePulse(ctx.clientId));
    if (body.action === "skip") return NextResponse.json(await skipPulse(ctx.clientId));
    return apiFailure('action must be "answer", "snooze" or "skip".', 400);
  } catch (error) {
    if (error instanceof PulseError) return apiFailure(error.message, error.status);
    return apiError(error, "Failed to save your answer");
  }
}
