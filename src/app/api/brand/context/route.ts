import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBrandSettings, getWriterVoiceConfig, getHarvestContext } from "@/services/brand";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { buildBrandContextResponse } from "@/services/brandContext";

/**
 * Structured brand context for the n8n drafting pipeline to ingest.
 * Sourced from the same `getBrandSettings()` the /api/brand and Brand Profile
 * tab use, so this cannot drift from what an operator edits there.
 *
 * The caller here is n8n (a server-to-server webhook call, not a signed-in
 * browser), so tenancy comes from a `clientId` query param rather than a
 * session — n8n's Assemble Brand Context node passes the client_id it
 * already carries from the workflow trigger payload.
 */
export async function GET(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return apiFailure("clientId query param is required", 400);
  }

  try {
    // The webhook secret authenticates the *caller* (n8n), not a tenant, and n8n
    // legitimately harvests for every tenant -- so this cannot be narrowed to one
    // clientId. What it can do is refuse ids that name no live tenant, so a typo
    // or a stale id fails loudly here instead of further downstream, where
    // getBrandSettings' fallback would hand back a plausible-looking default
    // profile for a tenant that does not exist.
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, status: true },
    });
    if (!client) {
      return apiFailure("Unknown clientId", 404);
    }
    if (client.status !== "ACTIVE") {
      return apiFailure(`Tenant ${clientId} is ${client.status}, not ACTIVE`, 409);
    }

    const [brand, voiceConfig, harvest] = await Promise.all([
      getBrandSettings(clientId),
      getWriterVoiceConfig(clientId),
      getHarvestContext(clientId),
    ]);

    return NextResponse.json(buildBrandContextResponse(brand, voiceConfig, harvest));
  } catch (error) {
    return apiError(error, "Failed to build brand context");
  }
}
