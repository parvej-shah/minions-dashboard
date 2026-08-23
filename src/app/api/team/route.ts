import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

/**
 * Every member (accepted) and pending invite for the caller's tenant.
 * Team & role-based access (Phase 4.5) -- see ClientMembership's schema
 * comment for why this is a separate table from User.clientId.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const memberships = await prisma.clientMembership.findMany({
      where: { clientId: ctx.clientId },
      orderBy: { invitedAt: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        invitedAt: true,
        acceptedAt: true,
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(
      memberships.map((m) => ({
        id: m.id,
        email: m.email,
        name: m.user?.name ?? null,
        role: m.role,
        invited_at: m.invitedAt.toISOString(),
        accepted_at: m.acceptedAt?.toISOString() ?? null,
        status: m.acceptedAt ? "ACTIVE" : "PENDING",
      }))
    );
  } catch (error) {
    return apiError(error, "Failed to load team");
  }
}
