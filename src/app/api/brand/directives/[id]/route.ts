import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";

import { toDirectiveDTO } from "@/lib/mappers/directive";
import { resolveAudienceScope, RETIRED_SCOPE_MESSAGE } from "@/constants/audience";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const audienceScope = body.audience_scope !== undefined ? resolveAudienceScope(body.audience_scope) : null;
    if (body.audience_scope !== undefined && !audienceScope) return apiFailure(RETIRED_SCOPE_MESSAGE, 400);

    const owned = await prisma.brandDirective.findFirst({
      where: { id, clientId: ctx.clientId },
      select: { id: true },
    });
    if (!owned) {
      return apiFailure("Brand directive not found", 404);
    }

    const updated = await prisma.brandDirective.update({
      where: { id },
      data: {
        ...(body.is_active !== undefined && { isActive: body.is_active }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.key !== undefined && { ruleKey: String(body.key).toLowerCase().replace(/\s+/g, "_") }),
        ...(body.content !== undefined && { instruction: body.content }),
        ...(body.priority !== undefined && { priority: Number(body.priority) }),
        ...(body.audience_scope !== undefined && { audienceScope: audienceScope! }),
      },
    });

    return NextResponse.json(toDirectiveDTO(updated));
  } catch (error) {
    return apiError(error, "Failed to update brand directive");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;

    const owned = await prisma.brandDirective.findFirst({
      where: { id, clientId: ctx.clientId },
      select: { id: true },
    });
    if (!owned) {
      return apiFailure("Brand directive not found", 404);
    }

    await prisma.brandDirective.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete brand directive");
  }
}
