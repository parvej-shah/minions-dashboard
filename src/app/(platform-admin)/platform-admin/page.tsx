"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  Eye,
  RefreshCw,
  Building2,
  ExternalLink,
  Search,
  X,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";
import { filterTenants, type TenantItem } from "@/lib/admin/adminNav";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string }
> = {
  ACTIVE: {
    label: "Active",
    badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  TRIAL: {
    label: "Trial",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  PAST_DUE: {
    label: "Past Due",
    badgeCls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  SUSPENDED: {
    label: "Suspended",
    badgeCls: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  CANCELED: {
    label: "Canceled",
    badgeCls: "bg-subtle/10 text-muted border-subtle/20",
  },
};

const STATUS_FILTERS = [
  { id: "ALL", label: "All Tenants" },
  { id: "ACTIVE", label: "Active" },
  { id: "TRIAL", label: "Trial" },
  { id: "PAST_DUE", label: "Past Due" },
  { id: "SUSPENDED", label: "Suspended" },
];

export default function PlatformAdminPage() {
  const {
    data: tenants,
    isLoading,
    reload,
  } = useApiResource<TenantItem[]>("/api/platform-admin/tenants", [], {
    errorMessage: "Could not load tenants",
  });
  const toast = useToast(4000);
  const [viewingAs, setViewingAs] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");

  const totalSpend = useMemo(
    () => tenants.reduce((acc, t) => acc + t.total_cost_usd, 0),
    [tenants]
  );
  const activeCount = useMemo(
    () => tenants.filter((t) => t.status === "ACTIVE").length,
    [tenants]
  );
  const trialCount = useMemo(
    () => tenants.filter((t) => t.status === "TRIAL").length,
    [tenants]
  );

  const filteredTenants = useMemo(
    () => filterTenants(tenants, searchQuery, statusFilter, sortBy),
    [tenants, searchQuery, statusFilter, sortBy]
  );

  const viewAsTenant = async (clientId: string) => {
    setViewingAs(clientId);
    try {
      await apiClient.post("/api/platform-admin/impersonate", { client_id: clientId });
      // Full reload so all dashboard server components pick up the impersonation cookie
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not start view-as-tenant session"));
      setViewingAs(null);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading tenants…" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Tenants & Workspaces</h1>
          <p className="text-sm text-muted mt-0.5">
            Cross-tenant status, monthly consumption, and support access.
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
            <div className="text-[11px] font-semibold text-muted tracking-tight">TOTAL TENANTS</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">{tenants.length}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-muted tracking-tight">ACTIVE</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">{activeCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-muted tracking-tight">IN TRIAL</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">{trialCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-muted tracking-tight">RECORDED SPEND</div>
            <div className="text-2xl font-bold text-ink mt-0.5 tabular-nums">${totalSpend.toFixed(2)}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, slug, or ID…"
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-2/80 p-0.5 rounded-xl border border-line/60">
            {STATUS_FILTERS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all font-medium ${
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

          {/* Sort selector */}
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort tenants"
              className="bg-surface-2/80 hover:bg-surface-2 border border-line rounded-xl pl-8 pr-6 py-1.5 text-xs text-ink focus:outline-none focus:border-brand/60 cursor-pointer appearance-none transition-all font-medium"
            >
              <option value="newest">Newest first</option>
              <option value="spend">Highest spend</option>
              <option value="assets">Most assets</option>
              <option value="members">Most members</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {filteredTenants.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
            <div className="text-sm font-semibold text-ink">No tenants found</div>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search query or status filter."
                : "No tenants exist in the database yet."}
            </p>
            {(searchQuery || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-3 text-xs text-brand font-semibold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                  <th className="p-3.5 font-semibold">TENANT</th>
                  <th className="p-3.5 font-semibold">STATUS</th>
                  <th className="p-3.5 font-semibold">PLAN</th>
                  <th className="p-3.5 font-semibold text-right">MEMBERS</th>
                  <th className="p-3.5 font-semibold text-right">ASSETS</th>
                  <th className="p-3.5 font-semibold text-right">SPEND</th>
                  <th className="p-3.5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredTenants.map((t) => {
                  const statusInfo =
                    STATUS_CONFIG[t.status.toUpperCase()] ?? STATUS_CONFIG.CANCELED;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-surface-2/60 transition-colors group"
                    >
                      <td className="p-3.5">
                        <Link
                          href={`/platform-admin/tenants/${t.id}`}
                          className="font-semibold text-ink group-hover:text-brand transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{t.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                        </Link>
                        <div className="text-[10px] text-muted font-mono mt-0.5">
                          {t.slug}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeCls}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-xs text-muted uppercase tracking-wider">
                          {t.plan_key}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono tabular-nums text-ink">
                        {t.member_count}
                      </td>
                      <td className="p-3.5 text-right font-mono tabular-nums text-ink">
                        {t.asset_count}
                      </td>
                      <td className="p-3.5 text-right font-mono tabular-nums text-brand font-semibold">
                        ${t.total_cost_usd.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/platform-admin/tenants/${t.id}`}
                            className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-muted hover:text-ink text-[11px] font-medium transition-all"
                          >
                            Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => viewAsTenant(t.id)}
                            disabled={viewingAs === t.id}
                            title="Start a support session to view this tenant's workspace"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand text-[11px] font-semibold transition-all disabled:opacity-60 shadow-xs"
                          >
                            {viewingAs === t.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            <span>View as</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-danger/90 text-white px-4 py-3 rounded-xl shadow-soft text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
