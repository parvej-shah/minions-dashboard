import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/server/http/respond";
import { createWorkspace } from "@/services/workspace";
import type { UserRole } from "@/constants/access";

const NO_WORKSPACE_MESSAGE = "Your workspace is not set up yet. Finish onboarding to start using Minions.";
const STAFF_NEEDS_TENANT_MESSAGE = "Platform staff must use the platform-admin API, or start a view-as-tenant session";
export const IMPERSONATION_COOKIE = "pa_impersonate_client_id";

export interface CurrentUser {
  id: string;
  email: string;
  clientId: string | null;
  role: UserRole;
}

type TenantAccess = { clientId: string; user: CurrentUser } | { error: Response };

// Re-reads the User row on every call instead of trusting session.user.clientId off the JWT.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) return null;

  return { id: dbUser.id, email: dbUser.email, clientId: dbUser.clientId, role: dbUser.role as UserRole };
}

export function isPlatformStaff(user: Pick<CurrentUser, "clientId" | "role">): boolean {
  return user.role === "SYSTEM_ADMIN";
}

async function getImpersonatedClientId(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(IMPERSONATION_COOKIE)?.value ?? null;
}

async function impersonatedClientFor(user: CurrentUser): Promise<string | null> {
  const impersonating = await getImpersonatedClientId();
  if (!impersonating || !isPlatformStaff(user)) return null;
  const client = await prisma.client.findUnique({ where: { id: impersonating }, select: { id: true } });
  return client?.id ?? null;
}

// A fresh Client row must exist the moment a user signs in, before setup asks for a name, so it is seeded from the email.
export function placeholderTenantName(email: string): string {
  return `${email.split("@")[0]}'s Workspace`;
}

// Setup promotes a real name only over a name that still matches this shape, so a chosen name is never silently renamed.
export function isPlaceholderTenantName(name: string | null | undefined): boolean {
  return !name?.trim() || /'s Workspace$/.test(name.trim());
}

async function provisioned(user: CurrentUser): Promise<TenantAccess> {
  const client = await createWorkspace(user, placeholderTenantName(user.email));
  return { clientId: client.id, user: { ...user, clientId: client.id, role: "OWNER" } };
}

export async function requireTenantAccess(autoProvision = false): Promise<TenantAccess> {
  const user = await getCurrentUser();
  if (!user) return { error: apiFailure("Unauthorized", 401) };

  const impersonated = await impersonatedClientFor(user);
  if (impersonated) return { clientId: impersonated, user };
  if (user.clientId) return { clientId: user.clientId, user };
  if (autoProvision) return provisioned(user);
  if (isPlatformStaff(user)) return { error: apiFailure(STAFF_NEEDS_TENANT_MESSAGE, 403) };
  return { error: apiFailure(NO_WORKSPACE_MESSAGE, 403) };
}

export const requireClientId = () => requireTenantAccess(false);

// Support sessions are refused so staff cannot attach their own third-party accounts to a customer's workspace.
export async function requireRealTenantUser(autoProvision = false): Promise<TenantAccess> {
  const user = await getCurrentUser();
  if (!user) return { error: apiFailure("Unauthorized", 401) };

  if ((await getImpersonatedClientId()) && isPlatformStaff(user)) {
    return {
      error: apiFailure(
        "Cannot link or modify third-party channel credentials while in a support/impersonation session. Please switch to your own workspace or have the tenant owner connect their account directly.",
        403
      ),
    };
  }
  if (user.clientId) return { clientId: user.clientId, user };
  return autoProvision ? provisioned(user) : { error: apiFailure(NO_WORKSPACE_MESSAGE, 403) };
}

export async function requirePlatformStaff(): Promise<{ user: CurrentUser } | { error: Response }> {
  const user = await getCurrentUser();
  if (!user) return { error: apiFailure("Unauthorized", 401) };
  if (!isPlatformStaff(user)) return { error: apiFailure("Platform-admin access required", 403) };
  return { user };
}
