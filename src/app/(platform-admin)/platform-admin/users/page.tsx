"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils/date";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  client_id: string | null;
  client_name: string | null;
  client_slug: string | null;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  SYSTEM_ADMIN: "bg-brand/10 text-brand border-brand/30",
  OWNER: "bg-brand/10 text-brand border-brand/30",
  MARKETING_DIRECTOR: "bg-brand/10 text-brand border-brand/30",
  MEMBER: "bg-subtle/10 text-muted border-subtle/30",
};

export default function PlatformAdminUsersPage() {
  const { data: users, isLoading } = useApiResource<UserRow[]>("/api/platform-admin/users", [], {
    errorMessage: "Could not load users",
  });

  if (isLoading) {
    return <LoadingState label="Loading users…" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted mt-1">Every account across every tenant.</p>
      </div>

      <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between max-w-xs">
        <div>
          <div className="text-[11px] font-mono text-muted">TOTAL USERS</div>
          <div className="text-xl font-bold text-ink mt-0.5">{users.length}</div>
        </div>
        <Users className="w-5 h-5 text-brand" />
      </div>

      <div className="rounded-2xl bg-surface border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-muted font-mono text-[11px]">
                <th className="p-3 font-semibold">USER</th>
                <th className="p-3 font-semibold">ROLE</th>
                <th className="p-3 font-semibold">TENANT</th>
                <th className="p-3 font-semibold text-right">JOINED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/70 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-ink">{u.name || u.email}</div>
                    <div className="text-[10px] text-subtle font-mono">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        ROLE_COLORS[u.role] ?? ROLE_COLORS.MEMBER
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.client_id ? (
                      <Link
                        href={`/platform-admin/tenants/${u.client_id}`}
                        className="text-muted hover:text-brand transition-colors"
                      >
                        {u.client_name}
                      </Link>
                    ) : (
                      <span className="text-subtle font-mono">— platform staff —</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono text-muted">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
