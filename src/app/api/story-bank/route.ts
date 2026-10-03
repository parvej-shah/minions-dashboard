import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { PulseError } from "@/services/pulse";
import { extractStory, finishSession, getStoryBank, saveStories } from "@/services/storyBank";

// An answer is turned into items by a model call and each item is checked.
export const maxDuration = 90;

/** How full the story bank is, the streak, and today's session questions. */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;
  try {
    return NextResponse.json(await getStoryBank(ctx.clientId));
  } catch (error) {
    return apiError(error, "Failed to load your story bank");
  }
}

/**
 *   POST { action: "extract", prompt_id, answer } -> items to confirm, nothing saved
 *   POST { action: "save", items }                -> saves the kept items
 *   POST { action: "finish" }                     -> one harvest from the new stories
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return apiFailure("Expected a JSON object.", 400);

  try {
    if (body.action === "extract") return NextResponse.json(await extractStory(ctx.clientId, body));
    if (body.action === "save") return NextResponse.json(await saveStories(ctx.clientId, body));
    if (body.action === "finish") return NextResponse.json(await finishSession(ctx.clientId));
    return apiFailure('action must be "extract", "save" or "finish".', 400);
  } catch (error) {
    if (error instanceof PulseError) return apiFailure(error.message, error.status);
    return apiError(error, "Failed to save your story");
  }
}
