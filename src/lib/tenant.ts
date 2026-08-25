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
 * this rather than pulling session.user fields directly.
 *
 * Re-fetches the User row fresh on every call rather than trusting
 * session.user.clientId straight off the JWT.
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
  return user.role === "SYSTEM_ADMIN";
}

/**
 * For API routes: resolves the caller's clientId or returns a 401/403
 * response to return directly. If an impersonation cookie is set and the
 * caller is platform staff, uses the impersonated clientId. Otherwise uses
 * the user's active clientId.
 */
export async function requireClientId(): Promise<
  { clientId: string; user: CurrentUser } | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: apiFailure("Unauthorized", 401) };
  }

  // 1. If viewing as a tenant via platform-admin impersonation cookie
  const impersonating = await getImpersonatedClientId();
  if (impersonating && isPlatformStaff(user)) {
    return { clientId: impersonating, user };
  }

  // 2. If user has an active workspace attached
  if (user.clientId) {
    return { clientId: user.clientId, user };
  }

  // 3. Platform staff with no active tenant scope and no impersonation
  if (isPlatformStaff(user)) {
    return {
      error: apiFailure("Platform staff must use the platform-admin API, or start a view-as-tenant session", 403),
    };
  }

  return { error: apiFailure("Account is not yet attached to a tenant", 403) };
}

/**
 * For platform-admin-only API routes: 403s for anyone who isn't SYSTEM_ADMIN.
 */
export async function requirePlatformStaff(): Promise<
  { user: CurrentUser } | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user) return { error: apiFailure("Unauthorized", 401) };
  if (!isPlatformStaff(user)) {
    return { error: apiFailure("Platform-admin access required", 403) };
  }
  return { user };
}

const IMPERSONATION_COOKIE = "pa_impersonate_client_id";

/** Reads the active "view as tenant" cookie, if any -- see requireClientId(). */
export async function getImpersonatedClientId(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get(IMPERSONATION_COOKIE)?.value ?? null;
}

export { IMPERSONATION_COOKIE };
