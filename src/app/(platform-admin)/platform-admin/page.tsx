"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, DollarSign, Eye, RefreshCw, Building2, ExternalLink } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  plan_key: string;
  subscription_status: string | null;
  current_period_end: string | null;
  member_count: number;
  asset_count: number;
  total_cost_usd: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-brand/10 text-brand border-brand/30",
  TRIAL: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
  PAST_DUE: "bg-gold/10 text-gold border-gold/30",
  SUSPENDED: "bg-danger/10 text-danger border-danger/30",
  CANCELED: "bg-subtle/10 text-subtle border-subtle/30",
};

export default function PlatformAdminPage() {
  const { data: tenants, isLoading } = useApiResource<TenantRow[]>("/api/platform-admin/tenants", [], {
    errorMessage: "Could not load tenants",
  });
  const toast = useToast(4000);
  const [viewingAs, setViewingAs] = useState<string | null>(null);

  const totalSpend = tenants.reduce((acc, t) => acc + t.total_cost_usd, 0);
  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;

  const viewAsTenant = async (clientId: string) => {
    setViewingAs(clientId);
    try {
      await apiClient.post("/api/platform-admin/impersonate", { client_id: clientId });
      // Full reload, not router.push(): every server component under (dashboard)
      // needs to see the new impersonation cookie on its next request.
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        <p className="text-sm text-muted mt-1">Cross-tenant status, usage, and support access.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted">TOTAL TENANTS</div>
            <div className="text-xl font-bold text-ink mt-0.5">{tenants.length}</div>
          </div>
          <Building2 className="w-5 h-5 text-brand" />
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted">ACTIVE</div>
            <div className="text-xl font-bold text-ink mt-0.5">{activeTenants}</div>
          </div>
          <Users className="w-5 h-5 text-[#3B82F6]" />
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted">TOTAL RECORDED SPEND</div>
            <div className="text-xl font-bold text-ink mt-0.5">${totalSpend.toFixed(2)}</div>
          </div>
          <DollarSign className="w-5 h-5 text-coral" />
        </div>
      </div>

      <div className="rounded-2xl bg-surface border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-muted font-mono text-[11px]">
                <th className="p-3 font-semibold">TENANT</th>
                <th className="p-3 font-semibold">STATUS</th>
                <th className="p-3 font-semibold">PLAN</th>
                <th className="p-3 font-semibold text-right">MEMBERS</th>
                <th className="p-3 font-semibold text-right">ASSETS</th>
                <th className="p-3 font-semibold text-right">SPEND</th>
                <th className="p-3 font-semibold text-right">SUPPORT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-surface-2/70 transition-colors">
                  <td className="p-3">
                    <Link
                      href={`/platform-admin/tenants/${t.id}`}
                      className="font-semibold text-ink hover:text-brand transition-colors inline-flex items-center gap-1.5"
                    >
                      {t.name}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </Link>
                    <div className="text-[10px] text-subtle font-mono">{t.slug}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        STATUS_COLORS[t.status] ?? STATUS_COLORS.CANCELED
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-muted">{t.plan_key}</td>
                  <td className="p-3 text-right font-mono">{t.member_count}</td>
                  <td className="p-3 text-right font-mono">{t.asset_count}</td>
                  <td className="p-3 text-right font-mono text-brand">${t.total_cost_usd.toFixed(3)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => viewAsTenant(t.id)}
                      disabled={viewingAs === t.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-muted hover:text-ink text-[11px] font-semibold transition-all disabled:opacity-60"
                    >
                      {viewingAs === t.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                      <span>View as</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-danger/90 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
