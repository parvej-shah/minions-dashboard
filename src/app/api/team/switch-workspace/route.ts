import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { getCurrentUser } from "@/lib/tenant";

/**
 * Switches the signed-in user's *active* workspace to another client they
 * belong to. Updates User.clientId/role directly rather than a
 * session-stored selection -- getCurrentUser()/requireClientId() already
 * re-read User fresh from Postgres on every call (see tenant.ts), so this
 * takes effect on the very next server request with zero changes needed
 * there. The client still calls useSession().update() as a best-effort JWT
 * refresh (same pattern as onboarding), but callers should not depend on it
 * alone -- see its own doc comment on why that trigger has proven unreliable.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiFailure("Unauthorized", 401);

  try {
    const body = await request.json();
    const clientId = (body.client_id || "").toString().trim();
    if (!clientId) return apiFailure("client_id is required", 400);

    const membership = await prisma.clientMembership.findFirst({
      where: { userId: user.id, clientId, acceptedAt: { not: null } },
    });
    if (!membership) {
      return apiFailure("You are not a member of that workspace", 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { clientId: membership.clientId, role: membership.role },
    });

    return NextResponse.json({ success: true, client_id: membership.clientId });
  } catch (error) {
    return apiError(error, "Failed to switch workspace");
  }
}
