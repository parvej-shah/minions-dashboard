import { prisma } from "@/lib/prisma";
import { getBrandSettings, getHarvestContext, getWriterVoiceConfig } from "@/services/brand";
import { buildBrandContextResponse } from "@/services/brandContext";
import { harvestFocusLane } from "@/services/contentPlan";
import { conflict, notFound } from "@/server/http/errors";

// n8n harvests for every tenant, so the webhook secret cannot narrow this to one clientId.
// Refusing ids that name no live tenant stops getBrandSettings' fallback from returning a plausible default profile.
async function requireActiveTenant(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, status: true } });
  if (!client) throw notFound("Unknown clientId");
  if (client.status !== "ACTIVE") throw conflict(`Tenant ${clientId} is ${client.status}, not ACTIVE`);
}

export async function loadBrandContext(clientId: string) {
  await requireActiveTenant(clientId);

  const [brand, voiceConfig, harvest, focusLane] = await Promise.all([
    getBrandSettings(clientId),
    getWriterVoiceConfig(clientId),
    getHarvestContext(clientId),
    harvestFocusLane(clientId),
  ]);

  // A targeted harvest for a content-plan slot sees only that slot's lane.
  const focused = focusLane ? harvest.author.lanes.filter((lane) => lane.id === focusLane) : [];
  if (focused.length) harvest.author = { ...harvest.author, lanes: focused };

  return buildBrandContextResponse(brand, voiceConfig, harvest);
}
