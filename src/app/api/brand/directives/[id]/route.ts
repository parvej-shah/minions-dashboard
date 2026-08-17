import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.brandDirective.update({
      where: { id },
      data: {
        ...(body.is_active !== undefined && { isActive: body.is_active }),
        ...(body.content !== undefined && { instruction: body.content }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.audience_scope !== undefined && { audienceScope: body.audience_scope }),
      },
    });

    return NextResponse.json({ success: true, id: updated.id, is_active: updated.isActive });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.brandDirective.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
