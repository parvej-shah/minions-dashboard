import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requirePlatformStaff, IMPERSONATION_COOKIE } from "@/lib/tenant";

const MAX_AGE_SECONDS = 2 * 60 * 60; // 2h -- a support session, not a standing grant

/** Current "view as tenant" status, for a UI indicator to check. */
export async function GET() {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  const store = await cookies();
  const clientId = store.get(IMPERSONATION_COOKIE)?.value ?? null;
  if (!clientId) return NextResponse.json({ impersonating: false, client: null });

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true } });
  if (!client) return NextResponse.json({ impersonating: false, client: null });

  return NextResponse.json({ impersonating: true, client });
}

/** Starts a view-as-tenant session, scoped by cookie only -- see requireClientId(). */
export async function POST(request: Request) {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const clientId = (body.client_id || "").toString().trim();
    if (!clientId) return apiFailure("client_id is required", 400);

    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true } });
    if (!client) return apiFailure("Client not found", 404);

    const store = await cookies();
    store.set(IMPERSONATION_COOKIE, clientId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE_SECONDS,
      path: "/",
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    return apiError(error, "Failed to start impersonation");
  }
}

/** Ends the current view-as-tenant session. */
export async function DELETE() {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
  return NextResponse.json({ success: true });
}
