import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { pulseHistory } from "@/services/pulse";

/** The last 12 weeks' answers and the items saved from each. */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;
  try {
    return NextResponse.json(await pulseHistory(ctx.clientId));
  } catch (error) {
    return apiError(error, "Failed to load your weekly updates");
  }
}
