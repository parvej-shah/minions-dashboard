import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/lib/api-response";
import type { UserRole } from "@/constants/access";

export interface CurrentUser {
  id: string;
  email: string;
  clientId: string | null;
  role: UserRole;
}

/**
 * Single source of truth for "who is calling, and which tenant do they belong
 * to." Every tenant-scoped API route and server component should read through
 * this rather than pulling session.user fields directly, so the definition of
 * "platform staff" (clientId === null && role === SYSTEM_ADMIN) only lives here.
 *
 * Re-fetches the User row fresh on every call rather than trusting
 * session.user.clientId straight off the JWT. The JWT is only supposed to be
 * stale-safe for values that don't change mid-session, but clientId does --
 * the onboarding wizard attaches it to a previously-bare account right in the
 * middle of a session (see /api/onboarding/client) -- and NextAuth's
 * useSession().update() trigger, meant to force a JWT refresh at exactly that
 * moment, turned out not to be reliable in this beta version (confirmed live:
 * the wizard's very next request still saw clientId: null despite the DB
 * already having the correct value). One extra indexed lookup per request is
 * a small, worthwhile price for not depending on that timing at all.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    clientId: dbUser.clientId,
    role: dbUser.role as UserRole,
  };
}

export function isPlatformStaff(user: Pick<CurrentUser, "clientId" | "role">): boolean {
  return user.clientId === null && user.role === "SYSTEM_ADMIN";
}

/**
 * For API routes: resolves the caller's clientId or returns a 401/403
 * response to return directly. Platform staff have no single tenant to scope
 * to, so they must not call routes that require one (they get a 403 rather
 * than silently reading every tenant's data).
 */
export async function requireClientId(): Promise<
  { clientId: string; user: CurrentUser } | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: apiFailure("Unauthorized", 401) };
  }
  if (!user.clientId) {
    return {
      error: apiFailure(
        isPlatformStaff(user)
          ? "Platform staff must use the platform-admin API, not tenant-scoped routes"
          : "Account is not yet attached to a tenant",
        403
      ),
    };
  }
  return { clientId: user.clientId, user };
}
