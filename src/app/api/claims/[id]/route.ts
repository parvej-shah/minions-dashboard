import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toClaimDTO } from "@/lib/mappers/asset";
import { apiError } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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
