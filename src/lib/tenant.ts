import { auth } from "@/lib/auth";
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
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    clientId: session.user.clientId ?? null,
    role: session.user.role,
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
