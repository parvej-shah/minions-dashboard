import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

interface MemberItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  status: "ACTIVE" | "PENDING";
}

/**
 * Every member (active & legacy direct users) and pending invite for the caller's tenant.
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

    const directUsers = await prisma.user.findMany({
      where: { clientId: ctx.clientId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const memberMap = new Map<string, MemberItem>();

    // 1. Direct workspace users
    for (const u of directUsers) {
      memberMap.set(u.email.toLowerCase(), {
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        role: u.role,
        invited_at: u.createdAt.toISOString(),
        accepted_at: u.createdAt.toISOString(),
        status: "ACTIVE",
      });
    }

    // 2. Client memberships (overrides id with membership id for invite management)
    for (const m of memberships) {
      const emailLower = m.email.toLowerCase();
      const existing = memberMap.get(emailLower);
      memberMap.set(emailLower, {
        id: m.id,
        email: m.email,
        name: m.user?.name ?? existing?.name ?? null,
        role: m.role,
        invited_at: m.invitedAt.toISOString(),
        accepted_at: m.acceptedAt?.toISOString() ?? null,
        status: m.acceptedAt ? "ACTIVE" : "PENDING",
      });
    }

    return NextResponse.json(Array.from(memberMap.values()));
  } catch (error) {
    return apiError(error, "Failed to load team");
  }
}
