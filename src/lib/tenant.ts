import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/server/http/respond";
import type { UserRole } from "@/constants/access";

/** An account that signed up but has not finished onboarding, so has no workspace yet. */
const NO_WORKSPACE_MESSAGE = "Your workspace is not set up yet. Finish onboarding to start using Minions.";

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
    const validClient = await prisma.client.findUnique({
      where: { id: impersonating },
      select: { id: true },
    });
    if (validClient) {
      return { clientId: impersonating, user };
    }
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

  return { error: apiFailure(NO_WORKSPACE_MESSAGE, 403) };
}

/**
 * The name a tenant gets before onboarding has asked for a real one.
 *
 * A fresh Client row must exist the moment a user signs in -- well before the
 * onboarding wizard collects their business name -- so it is seeded from the
 * email's local part. Onboarding then promotes the real name (see
 * /api/onboarding/setup), but only over a name still matching this shape:
 * a tenant that already has a real name must never be silently renamed.
 */
export function placeholderTenantName(email: string): string {
  return `${email.split("@")[0]}'s Workspace`;
}

/**
 * True when `name` is still the auto-generated placeholder rather than
 * something the user chose, and is therefore safe to overwrite.
 */
export function isPlaceholderTenantName(name: string | null | undefined): boolean {
  return !name?.trim() || /'s Workspace$/.test(name.trim());
}

/**
 * Creates a new Client workspace for a fresh user and attaches it as OWNER.
 */
export async function getOrCreateTenant(user: CurrentUser, name?: string): Promise<string> {
  if (user.clientId) return user.clientId;

  const clientName = name || placeholderTenantName(user.email);
  const baseSlug = clientName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "workspace";

  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const client = await prisma.client.create({
    data: {
      name: clientName,
      slug,
      status: "ACTIVE",
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { clientId: client.id, role: "OWNER" },
  });

  await prisma.clientMembership.create({
    data: {
      clientId: client.id,
      userId: user.id,
      email: user.email,
      role: "OWNER",
      acceptedAt: new Date(),
    },
  });

  return client.id;
}

/**
 * For credential-linking and security-sensitive routes: blocks action if the
 * caller is currently viewing via a platform-admin support/impersonation session.
 * Prevents staff from accidentally connecting their personal third-party accounts
 * (LinkedIn, Facebook, etc.) to a customer's workspace.
 */
export async function requireRealTenantUser(autoProvision = false): Promise<
  { clientId: string; user: CurrentUser } | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: apiFailure("Unauthorized", 401) };
  }

  const impersonating = await getImpersonatedClientId();
  if (impersonating && isPlatformStaff(user)) {
    return {
      error: apiFailure(
        "Cannot link or modify third-party channel credentials while in a support/impersonation session. Please switch to your own workspace or have the tenant owner connect their account directly.",
        403
      ),
    };
  }

  if (user.clientId) {
    return { clientId: user.clientId, user };
  }

  if (autoProvision) {
    const clientId = await getOrCreateTenant(user);
    return { clientId, user: { ...user, clientId, role: "OWNER" } };
  }

  return { error: apiFailure(NO_WORKSPACE_MESSAGE, 403) };
}

/**
 * For onboarding routes that write tenant data (BrandProfile, BrandDirective,
 * channel activation flags) but never touch third-party credentials --
 * unlike requireRealTenantUser, this allows a platform-admin impersonation
 * session through (support staff can run onboarding/AI-generation on a
 * tenant's behalf), while still auto-provisioning a fresh Client for a
 * genuinely new signup. Same shape as requireClientId, plus autoProvision.
 */
export async function requireTenantAccess(autoProvision = false): Promise<
  { clientId: string; user: CurrentUser } | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: apiFailure("Unauthorized", 401) };
  }

  const impersonating = await getImpersonatedClientId();
  if (impersonating && isPlatformStaff(user)) {
    const validClient = await prisma.client.findUnique({
      where: { id: impersonating },
      select: { id: true },
    });
    if (validClient) {
      return { clientId: impersonating, user };
    }
  }

  if (user.clientId) {
    return { clientId: user.clientId, user };
  }

  if (autoProvision) {
    const clientId = await getOrCreateTenant(user);
    return { clientId, user: { ...user, clientId, role: "OWNER" } };
  }

  if (isPlatformStaff(user)) {
    return {
      error: apiFailure("Platform staff must use the platform-admin API, or start a view-as-tenant session", 403),
    };
  }

  return { error: apiFailure(NO_WORKSPACE_MESSAGE, 403) };
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
async function getImpersonatedClientId(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get(IMPERSONATION_COOKIE)?.value ?? null;
}

export { IMPERSONATION_COOKIE };
