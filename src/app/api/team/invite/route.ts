import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

const INVITABLE_ROLES = ["OWNER", "MARKETING_DIRECTOR", "MEMBER"];

/**
 * Invites an email to the caller's tenant. If that email already has a User
 * row (an existing platform user), the membership resolves immediately;
 * otherwise it's a pending invite (userId: null) that auth.ts's signIn
 * callback resolves the first time that email actually signs in.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  if (!["OWNER", "MARKETING_DIRECTOR"].includes(ctx.user.role)) {
    return apiFailure("Only an owner or marketing director can invite team members", 403);
  }

  try {
    const body = await request.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const role = (body.role || "").toString().trim().toUpperCase();

    if (!email || !email.includes("@")) return apiFailure("A valid email is required", 400);
    if (!INVITABLE_ROLES.includes(role)) {
      return apiFailure(`role must be one of: ${INVITABLE_ROLES.join(", ")}`, 400);
    }

    const existing = await prisma.clientMembership.findUnique({
      where: { email_clientId: { email, clientId: ctx.clientId } },
    });
    if (existing) {
      return apiFailure(
        existing.acceptedAt ? "This person is already on your team" : "This email already has a pending invite",
        409
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    const membership = await prisma.clientMembership.create({
      data: {
        email,
        role,
        clientId: ctx.clientId,
        userId: existingUser?.id ?? null,
        acceptedAt: existingUser ? new Date() : null,
      },
    });

    return NextResponse.json(
      { id: membership.id, email: membership.email, role: membership.role, resolved: Boolean(existingUser) },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error, "Failed to invite team member");
  }
}
