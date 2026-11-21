"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Users, Shield, Crown, RefreshCw, Search, X, Briefcase } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils/date";
import { filterUsers, type UserItem } from "@/lib/admin/adminNav";

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeCls: string }
> = {
  SYSTEM_ADMIN: {
    label: "Platform Admin",
    badgeCls: "bg-coral/10 text-coral border-coral/30",
  },
  OWNER: {
    label: "Owner",
    badgeCls: "bg-brand/10 text-brand border-brand/30",
  },
  MARKETING_DIRECTOR: {
    label: "Director",
    badgeCls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  MEMBER: {
    label: "Member",
    badgeCls: "bg-subtle/10 text-muted border-subtle/20",
  },
};

const ROLE_FILTERS = [
  { id: "ALL", label: "All Users" },
  { id: "SYSTEM_ADMIN", label: "Platform Staff" },
  { id: "OWNER", label: "Owners" },
  { id: "MARKETING_DIRECTOR", label: "Directors" },
  { id: "MEMBER", label: "Members" },
];

export default function PlatformAdminUsersPage() {
  const {
    data: users,
    isLoading,
    reload,
  } = useApiResource<UserItem[]>("/api/platform-admin/users", [], {
    errorMessage: "Could not load users",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const adminCount = useMemo(
    () => users.filter((u) => u.role === "SYSTEM_ADMIN").length,
    [users]
  );
  const ownerCount = useMemo(
    () => users.filter((u) => u.role === "OWNER").length,
    [users]
  );
  const memberCount = useMemo(
    () => users.filter((u) => u.role === "MEMBER" || u.role === "MARKETING_DIRECTOR").length,
    [users]
  );

  const filteredUsers = useMemo(
    () => filterUsers(users, searchQuery, roleFilter),
    [users, searchQuery, roleFilter]
  );

  if (isLoading) {
    return <LoadingState label="Loading users…" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">User Directory</h1>
          <p className="text-sm text-muted mt-0.5">
            Every registered account, administrative role, and tenant membership.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-2 border border-line text-xs font-semibold text-muted hover:text-ink transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-muted tracking-tight">TOTAL USERS</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">{users.length}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-muted tracking-tight">PLATFORM STAFF</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">{adminCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-muted tracking-tight">WORKSPACE OWNERS</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">{ownerCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Crown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-muted tracking-tight">TEAM MEMBERS</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">{memberCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-muted">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or tenant…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2/80 hover:bg-surface-2 focus:bg-surface border border-line focus:border-brand/60 rounded-xl pl-9 pr-8 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1 bg-surface-2/80 p-0.5 rounded-xl border border-line/60 overflow-x-auto">
          {ROLE_FILTERS.map((tab) => {
            const active = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all font-medium whitespace-nowrap ${
                  active
                    ? "bg-surface font-semibold text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
            <div className="text-sm font-semibold text-ink">No users found</div>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {searchQuery || roleFilter !== "ALL"
                ? "Try adjusting your search query or role filter."
                : "No users exist in the directory yet."}
            </p>
            {(searchQuery || roleFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("ALL");
                }}
                className="mt-3 text-xs text-brand font-semibold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                  <th className="p-3.5 font-semibold">USER</th>
                  <th className="p-3.5 font-semibold">ROLE</th>
                  <th className="p-3.5 font-semibold">WORKSPACE / TENANT</th>
                  <th className="p-3.5 font-semibold text-right">JOINED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredUsers.map((u) => {
                  const roleInfo =
                    ROLE_CONFIG[u.role.toUpperCase()] ?? ROLE_CONFIG.MEMBER;
                  const initial = (u.name || u.email).charAt(0).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surface-2/60 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center font-semibold text-xs text-ink shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-ink">
                              {u.name || u.email}
                            </div>
                            <div className="text-[10px] text-muted font-mono mt-0.5">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleInfo.badgeCls}`}
                        >
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.client_id ? (
                          <Link
                            href={`/platform-admin/tenants/${u.client_id}`}
                            className="font-medium text-ink hover:text-brand transition-colors inline-flex items-center gap-1"
                          >
                            <span>{u.client_name ?? u.client_slug}</span>
                            <span className="text-[10px] font-mono text-muted">
                              ({u.client_slug})
                            </span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-mono text-muted bg-surface-2 px-2 py-0.5 rounded border border-line">
                            Platform Staff
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono tabular-nums text-muted">
                        {formatDate(u.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
