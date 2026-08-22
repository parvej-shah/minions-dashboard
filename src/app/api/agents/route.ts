import { NextResponse } from "next/server";
import { getPipelineFleet } from "@/services/agents";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    return NextResponse.json(await getPipelineFleet(ctx.clientId));
  } catch (error) {
    return apiError(error, "Failed to fetch agents");
  }
}
