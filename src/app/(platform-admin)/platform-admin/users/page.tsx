"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";

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
  SYSTEM_ADMIN: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30",
  OWNER: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
  MARKETING_DIRECTOR: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
  MEMBER: "bg-[#64748B]/10 text-[#94A3B8] border-[#64748B]/30",
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
        <p className="text-sm text-[#94A3B8] mt-1">Every account across every tenant.</p>
      </div>

      <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between max-w-xs">
        <div>
          <div className="text-[11px] font-mono text-[#94A3B8]">TOTAL USERS</div>
          <div className="text-xl font-bold text-[#F1F5F9] mt-0.5">{users.length}</div>
        </div>
        <Users className="w-5 h-5 text-[#00C9A7]" />
      </div>

      <div className="rounded-2xl bg-[#0F1419] border border-[#1F2D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-[#1F2D3D] text-[#94A3B8] font-mono text-[11px]">
                <th className="p-3 font-semibold">USER</th>
                <th className="p-3 font-semibold">ROLE</th>
                <th className="p-3 font-semibold">TENANT</th>
                <th className="p-3 font-semibold text-right">JOINED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2D3D]/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#161D26]/70 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-[#F1F5F9]">{u.name || u.email}</div>
                    <div className="text-[10px] text-[#64748B] font-mono">{u.email}</div>
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
                        className="text-[#94A3B8] hover:text-[#00C9A7] transition-colors"
                      >
                        {u.client_name}
                      </Link>
                    ) : (
                      <span className="text-[#64748B] font-mono">— platform staff —</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono text-[#94A3B8]">
                    {new Date(u.created_at).toLocaleDateString()}
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
