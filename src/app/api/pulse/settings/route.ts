import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { PulseError, updatePulseSettings } from "@/services/pulse";

/**
 * The weekly question's switch and day, and the workspace timezone it runs in.
 *
 *   PATCH { enabled?, day? (1 = Monday ... 7 = Sunday), timezone?, timezone_confirmed? }
 */
export async function PATCH(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return apiFailure("Expected a JSON object.", 400);

  try {
    return NextResponse.json(await updatePulseSettings(ctx.clientId, body));
  } catch (error) {
    if (error instanceof PulseError) return apiFailure(error.message, error.status);
    return apiError(error, "Failed to save the weekly question settings");
  }
}
