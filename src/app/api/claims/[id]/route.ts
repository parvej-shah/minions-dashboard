import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({ success: true, claim: updated });
  } catch (error) {
    console.error("Error updating claim in Prisma:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}
