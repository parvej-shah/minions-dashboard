import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { gateHarvestRequest } from "@/services/harvestGate";

/**
 * The authority gate for 01_idea_harvester (phase 3 of
 * docs/product/authority-flywheel-plan.md). n8n POSTs the ideas a model
 * returned together with the brand context the prompt was rendered from, and
 * gets each idea back with its verdict, reasons, score and the metadata the
 * ideas table stores. The decisions live in src/lib/harvest/gate.ts.
 *
 *   { client_id, mode: "harvest" | "refine", ideas: [...], context: {...},
 *     market_signals?: [...], notes?: [...] }
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return apiFailure("Body must be a JSON object", 400);

  try {
    const result = await gateHarvestRequest(body as Record<string, unknown>);
    if ("error" in result) return apiFailure(result.error, 400);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, "Failed to gate harvested ideas");
  }
}
