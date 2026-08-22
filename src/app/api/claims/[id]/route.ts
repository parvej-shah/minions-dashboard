import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toClaimDTO } from "@/lib/mappers/asset";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Claim has no client_id of its own — tenancy is transitive via its Asset.
    const owned = await prisma.claim.findFirst({
      where: { id, asset: { clientId: ctx.clientId } },
      select: { id: true },
    });
    if (!owned) {
      return apiFailure("Claim not found", 404);
    }

    const updated = await prisma.claim.update({
      where: { id },
      data: {
        ...(body.verified && { verified: body.verified }),
        ...(body.notes && { notes: body.notes }),
      },
    });

    return NextResponse.json({ success: true, claim: toClaimDTO(updated) });
  } catch (error) {
    return apiError(error, "Failed to update claim");
  }
}
