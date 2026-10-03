import { prisma } from "@/lib/prisma";
import { toClaimDTO } from "@/lib/mappers/asset";
import type { JsonObject } from "@/server/http/body";
import { notFound } from "@/server/http/errors";

// A claim has no client_id of its own; tenancy is transitive through its asset.
export async function updateClaim(clientId: string, id: string, body: JsonObject) {
  const owned = await prisma.claim.findFirst({ where: { id, asset: { clientId } }, select: { id: true } });
  if (!owned) throw notFound("Claim not found");

  const updated = await prisma.claim.update({
    where: { id },
    data: {
      ...(body.verified ? { verified: body.verified as string } : {}),
      ...(body.notes ? { notes: body.notes as string } : {}),
    },
  });
  return toClaimDTO(updated);
}
