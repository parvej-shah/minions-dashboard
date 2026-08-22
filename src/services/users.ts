import { prisma } from "@/lib/prisma";

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  clientId: string | null;
  createdAt: string;
}

/**
 * Lists the app's own `User` rows (role/tenant membership now lives there,
 * not in Supabase auth metadata — see src/lib/auth.ts). This is a
 * platform-level listing; callers must confirm the caller is platform staff
 * before exposing it, this function does not do that check itself.
 */
export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name ?? u.email,
    role: u.role,
    clientId: u.clientId,
    createdAt: u.createdAt.toISOString(),
  }));
}
