import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_ROLES = ["OWNER", "MARKETING_DIRECTOR", "MEMBER"];

/**
 * Updates a team member's role.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  if (!["OWNER", "MARKETING_DIRECTOR"].includes(ctx.user.role)) {
    return apiFailure("Only an owner or marketing director can change member roles", 403);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const role = (body.role || "").toString().trim().toUpperCase();

    if (!VALID_ROLES.includes(role)) {
      return apiFailure(`Role must be one of: ${VALID_ROLES.join(", ")}`, 400);
    }

    // Check membership first
    const membership = await prisma.clientMembership.findUnique({ where: { id } });
    if (membership && membership.clientId === ctx.clientId) {
      const updated = await prisma.clientMembership.update({
        where: { id },
        data: { role },
      });

      if (membership.userId) {
        const user = await prisma.user.findUnique({ where: { id: membership.userId } });
        if (user?.clientId === ctx.clientId) {
          await prisma.user.update({
            where: { id: membership.userId },
            data: { role },
          });
        }
      }

      return NextResponse.json({ success: true, member: updated });
    }

    // Check direct user
    const directUser = await prisma.user.findUnique({ where: { id } });
    if (directUser && directUser.clientId === ctx.clientId) {
      if (directUser.id === ctx.user.id && ctx.user.role === "OWNER" && role !== "OWNER") {
        return apiFailure("You cannot demote yourself from workspace owner", 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
      });

      return NextResponse.json({ success: true, member: updatedUser });
    }

    return apiFailure("Team member not found", 404);
  } catch (error) {
    return apiError(error, "Failed to update team member");
  }
}

/**
 * Removes a team member or cancels a pending invite.
 * Handles both ClientMembership IDs and direct User IDs.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  if (!["OWNER", "MARKETING_DIRECTOR"].includes(ctx.user.role)) {
    return apiFailure("Only an owner or marketing director can remove team members", 403);
  }

  try {
    const { id } = await params;

    // 1. Try finding by ClientMembership
    const membership = await prisma.clientMembership.findUnique({ where: { id } });
    if (membership && membership.clientId === ctx.clientId) {
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
    }

    // 2. Try finding by direct User
    const directUser = await prisma.user.findUnique({ where: { id } });
    if (directUser && directUser.clientId === ctx.clientId) {
      if (directUser.id === ctx.user.id) {
        return apiFailure("You can't remove yourself from your own workspace", 400);
      }

      await prisma.user.update({
        where: { id },
        data: { clientId: null, role: "MEMBER" },
      });

      return NextResponse.json({ success: true });
    }

    return apiFailure("Team member not found", 404);
  } catch (error) {
    return apiError(error, "Failed to remove team member");
  }
}
