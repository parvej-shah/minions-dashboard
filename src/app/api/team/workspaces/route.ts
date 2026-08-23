import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";

/**
 * Every accepted workspace the signed-in user belongs to, for the sidebar's
 * workspace switcher. Only rendered when there's more than one -- the
 * common single-tenant case reads this once and never shows a switcher.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiFailure("Unauthorized", 401);

  try {
    const memberships = await prisma.clientMembership.findMany({
      where: { userId: user.id, acceptedAt: { not: null } },
      orderBy: { acceptedAt: "asc" },
      select: { clientId: true, role: true, client: { select: { name: true, slug: true } } },
    });

    return NextResponse.json(
      memberships.map((m) => ({
        client_id: m.clientId,
        name: m.client.name,
        slug: m.client.slug,
        role: m.role,
        active: m.clientId === user.clientId,
      }))
    );
  } catch (error) {
    return apiError(error, "Failed to load workspaces");
  }
}
