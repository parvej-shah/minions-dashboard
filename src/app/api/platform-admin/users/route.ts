import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/server/http/respond";
import { requirePlatformStaff } from "@/lib/tenant";

/**
 * Cross-tenant user list for the platform-admin dashboard -- the "who are our
 * users" view. Sibling to /api/platform-admin/tenants, same guard.
 */
export async function GET() {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clientId: true,
        createdAt: true,
        client: { select: { name: true, slug: true } },
      },
    });

    const rows = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      client_id: u.clientId,
      client_name: u.client?.name ?? null,
      client_slug: u.client?.slug ?? null,
      created_at: u.createdAt.toISOString(),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error, "Failed to load users");
  }
}
