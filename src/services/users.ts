import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveUserRole } from "@/constants/access";

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  confirmed: boolean;
  created_at: string;
  last_sign_in_at: string;
}

/**
 * Lists Supabase auth users. Stays on the Supabase admin client because
 * `auth.admin.listUsers()` has no Prisma equivalent.
 */
export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const { data, error } = await getSupabaseAdmin().auth.admin.listUsers();
  if (error) throw new Error(error.message);

  return data.users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    name:
      (u.user_metadata?.name as string | undefined) ??
      (u.email?.includes("parvej") ? "Parvej Shah" : "XpeedLab Admin"),
    role: (u.user_metadata?.role as string | undefined) ?? resolveUserRole(u.email),
    confirmed: !!u.email_confirmed_at,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? u.created_at,
  }));
}
