import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Removes a team member or cancels a pending invite.
 *
 * Deleting the membership row alone would not actually revoke access --
 * `User.clientId` (not ClientMembership) is what every tenant-scoped route
 * reads via requireClientId(). If the removed membership was that user's
 * *active* workspace, this also clears User.clientId (falling back to
 * another accepted membership if they have one), so removal takes effect
 * immediately rather than leaving a stale grant.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  if (!["OWNER", "MARKETING_DIRECTOR"].includes(ctx.user.role)) {
    return apiFailure("Only an owner or marketing director can remove team members", 403);
  }

  try {
    const { id } = await params;
    const membership = await prisma.clientMembership.findUnique({ where: { id } });
    if (!membership || membership.clientId !== ctx.clientId) {
      return apiFailure("Membership not found", 404);
    }
    if (membership.role === "OWNER" && membership.userId === ctx.user.id) {
      return apiFailure("You can't remove yourself as the owner", 400);
    }

    const affectedUserId = membership.userId;

    await prisma.$transaction(async (tx) => {
      await tx.clientMembership.delete({ where: { id } });

      if (!affectedUserId) return;
      const user = await tx.user.findUnique({ where: { id: affectedUserId }, select: { clientId: true } });
      if (user?.clientId !== ctx.clientId) return; // wasn't their active workspace anyway

      const fallback = await tx.clientMembership.findFirst({
        where: { userId: affectedUserId, acceptedAt: { not: null } },
        orderBy: { acceptedAt: "asc" },
      });

      await tx.user.update({
        where: { id: affectedUserId },
        data: fallback
          ? { clientId: fallback.clientId, role: fallback.role }
          : { clientId: null, role: "MEMBER" },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "Failed to remove team member");
  }
}
