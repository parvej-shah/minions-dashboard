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
  ACTIVE: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
  TRIAL: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
  PAST_DUE: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  SUSPENDED: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
  CANCELED: "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/30",
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
        <p className="text-sm text-[#94A3B8] mt-1">Cross-tenant status, usage, and support access.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[#94A3B8]">TOTAL TENANTS</div>
            <div className="text-xl font-bold text-[#F1F5F9] mt-0.5">{tenants.length}</div>
          </div>
          <Building2 className="w-5 h-5 text-[#00C9A7]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[#94A3B8]">ACTIVE</div>
            <div className="text-xl font-bold text-[#F1F5F9] mt-0.5">{activeTenants}</div>
          </div>
          <Users className="w-5 h-5 text-[#3B82F6]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[#94A3B8]">TOTAL RECORDED SPEND</div>
            <div className="text-xl font-bold text-[#F1F5F9] mt-0.5">${totalSpend.toFixed(2)}</div>
          </div>
          <DollarSign className="w-5 h-5 text-[#ff6b4a]" />
        </div>
      </div>

      <div className="rounded-2xl bg-[#0F1419] border border-[#1F2D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-[#1F2D3D] text-[#94A3B8] font-mono text-[11px]">
                <th className="p-3 font-semibold">TENANT</th>
                <th className="p-3 font-semibold">STATUS</th>
                <th className="p-3 font-semibold">PLAN</th>
                <th className="p-3 font-semibold text-right">MEMBERS</th>
                <th className="p-3 font-semibold text-right">ASSETS</th>
                <th className="p-3 font-semibold text-right">SPEND</th>
                <th className="p-3 font-semibold text-right">SUPPORT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2D3D]/60">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-[#161D26]/70 transition-colors">
                  <td className="p-3">
                    <Link
                      href={`/platform-admin/tenants/${t.id}`}
                      className="font-semibold text-[#F1F5F9] hover:text-[#00C9A7] transition-colors inline-flex items-center gap-1.5"
                    >
                      {t.name}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </Link>
                    <div className="text-[10px] text-[#64748B] font-mono">{t.slug}</div>
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
                  <td className="p-3 font-mono text-[#94A3B8]">{t.plan_key}</td>
                  <td className="p-3 text-right font-mono">{t.member_count}</td>
                  <td className="p-3 text-right font-mono">{t.asset_count}</td>
                  <td className="p-3 text-right font-mono text-[#00C9A7]">${t.total_cost_usd.toFixed(3)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => viewAsTenant(t.id)}
                      disabled={viewingAs === t.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-[11px] font-semibold transition-all disabled:opacity-60"
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#EF4444]/90 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
