"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Inbox,
  Eye,
  RefreshCw,
  Building2,
  Layers,
  Sparkles,
  Cpu,
  Globe,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import EmptyState from "@/components/ui/EmptyState";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatDateTime } from "@/utils/date";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  created_at: string;
  plan_key: string;
  plan_assets_per_month: number;
  assets_per_month_override: number | null;
  subscription_status: string | null;
  pipeline_runs: { id: string; type: string; status: string; created_at: string; updated_at: string }[];
  ideas: { id: string; raw_idea: string; status: string; pillar: string; created_at: string }[];
  assets: {
    id: string;
    title: string;
    status: string;
    claims_ok: string;
    published_urls: string | null;
    generation_cost: number;
    created_at: string;
  }[];
  blogs: { slug: string; title: string; published_at: string }[];
}

type TabKey = "overview" | "assets" | "runs" | "ideas" | "blogs";

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    data: tenant,
    isLoading,
    setData,
    reload,
  } = useApiResource<TenantDetail | null>(
    `/api/platform-admin/tenants/${id}`,
    null,
    { errorMessage: "Could not load tenant" }
  );
  const toast = useToast(4000);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [overrideInput, setOverrideInput] = useState<string>("");
  const [savingOverride, setSavingOverride] = useState(false);
  const [viewingAs, setViewingAs] = useState(false);

  if (isLoading || !tenant) {
    return <LoadingState label="Loading tenant details…" />;
  }

  const effectiveCap = tenant.assets_per_month_override ?? tenant.plan_assets_per_month;
  const totalAssetCost = tenant.assets.reduce((sum, a) => sum + a.generation_cost, 0);

  const viewAsTenant = async () => {
    setViewingAs(true);
    try {
      await apiClient.post("/api/platform-admin/impersonate", { client_id: id });
      // Full reload to load impersonation cookie in dashboard components
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not start view-as-tenant session"));
      setViewingAs(false);
    }
  };

  const saveOverride = async () => {
    const trimmed = overrideInput.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      toast.show("Enter a non-negative whole number, or leave blank to clear the override.");
      return;
    }
    setSavingOverride(true);
    try {
      const updated = await apiClient.patch<{ id: string; assets_per_month_override: number | null }>(
        `/api/platform-admin/tenants/${id}`,
        { assets_per_month_override: value }
      );
      setData((prev) => (prev ? { ...prev, assets_per_month_override: updated.assets_per_month_override } : prev));
      setOverrideInput("");
      toast.show("Usage cap updated successfully.");
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not update usage cap"));
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/platform-admin"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to tenants</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{tenant.name}</h1>
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-brand/10 text-brand border-brand/20">
              {tenant.status}
            </span>
            <span className="text-xs font-mono text-muted uppercase bg-surface-2 px-2 py-0.5 rounded border border-line">
              {tenant.plan_key}
            </span>
          </div>
          <p className="text-xs text-muted mt-1 font-mono">
            ID: {tenant.id} · slug: {tenant.slug} · {tenant.timezone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-2 border border-line text-xs font-semibold text-muted hover:text-ink transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={viewAsTenant}
            disabled={viewingAs}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand text-xs font-semibold transition-all disabled:opacity-60 shadow-xs"
          >
            {viewingAs ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span>View as this tenant</span>
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="border-b border-line">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Overview & Quota", icon: Building2 },
            { id: "assets", label: `Assets (${tenant.assets.length})`, icon: Layers },
            { id: "runs", label: `Pipeline Runs (${tenant.pipeline_runs.length})`, icon: Cpu },
            { id: "ideas", label: `Ideas (${tenant.ideas.length})`, icon: Sparkles },
            { id: "blogs", label: `Blog (${tenant.blogs.length})`, icon: Globe },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? "border-brand text-brand font-semibold"
                    : "border-transparent text-muted hover:text-ink hover:border-line"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-brand" : "text-subtle"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab: Overview & Quota */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="text-[11px] font-semibold text-muted tracking-tight">MONTHLY CAP</div>
              <div className="text-xl font-bold text-ink mt-0.5 tabular-nums">
                {effectiveCap} <span className="text-xs font-normal text-muted">assets/mo</span>
              </div>
              <div className="text-[10px] text-muted font-mono mt-1">
                {tenant.assets_per_month_override !== null ? "Custom override" : "Plan standard"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="text-[11px] font-semibold text-muted tracking-tight">TOTAL ASSETS</div>
              <div className="text-xl font-bold text-ink mt-0.5 tabular-nums">
                {tenant.assets.length}
              </div>
              <div className="text-[10px] text-muted font-mono mt-1">Lifetime generated</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="text-[11px] font-semibold text-muted tracking-tight">ASSET GENERATION COST</div>
              <div className="text-xl font-bold text-brand mt-0.5 tabular-nums">
                ${totalAssetCost.toFixed(3)}
              </div>
              <div className="text-[10px] text-muted font-mono mt-1">Model & compute fees</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="text-[11px] font-semibold text-muted tracking-tight">IDEAS IN STOCK</div>
              <div className="text-xl font-bold text-ink mt-0.5 tabular-nums">
                {tenant.ideas.length}
              </div>
              <div className="text-[10px] text-muted font-mono mt-1">Harvested pool</div>
            </div>
          </div>

          {/* Usage cap override form */}
          <div className="p-5 rounded-2xl bg-surface border border-line space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div>
              <h2 className="text-sm font-bold text-ink">Usage Quota & Monthly Override</h2>
              <p className="text-xs text-muted mt-0.5">
                Set a custom monthly asset production cap for this tenant, bypassing their plan limits.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-2 border border-line text-xs space-y-1">
              <div className="text-muted">
                Plan default (<span className="font-mono font-semibold text-ink">{tenant.plan_key}</span>):{" "}
                <span className="font-semibold text-ink">{tenant.plan_assets_per_month}</span> assets/month.
              </div>
              <div>
                {tenant.assets_per_month_override !== null ? (
                  <span className="text-brand font-semibold">
                    Override active: {tenant.assets_per_month_override} assets/month.
                  </span>
                ) : (
                  <span className="text-muted">No custom override set — currently using the plan default.</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <input
                type="number"
                min={0}
                placeholder={
                  tenant.assets_per_month_override !== null
                    ? String(tenant.assets_per_month_override)
                    : "e.g. 50"
                }
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                className="bg-surface-2 border border-line rounded-xl px-3 py-1.5 text-xs text-ink w-48 focus:outline-none focus:border-brand/60"
              />
              <button
                type="button"
                onClick={saveOverride}
                disabled={savingOverride}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 text-xs font-bold transition-all disabled:opacity-60 shadow-xs"
              >
                {savingOverride ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Cap</span>
              </button>
              {tenant.assets_per_month_override !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setOverrideInput("");
                    void saveOverride();
                  }}
                  className="text-xs text-subtle hover:text-danger transition-colors font-medium ml-2"
                >
                  Clear override
                </button>
              )}
            </div>
            <p className="text-[11px] text-subtle">
              Enter a positive whole number to set a custom quota, or clear it to revert to the plan default.
            </p>
          </div>

          {/* Details metadata */}
          <div className="p-5 rounded-2xl bg-surface border border-line space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h2 className="text-sm font-bold text-ink">Workspace Metadata</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-2 border border-line/60">
                <div className="text-[11px] text-muted">Created Date</div>
                <div className="text-ink font-semibold mt-0.5">{formatDate(tenant.created_at)}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-line/60">
                <div className="text-[11px] text-muted">Timezone</div>
                <div className="text-ink font-semibold mt-0.5 font-mono">{tenant.timezone}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-line/60">
                <div className="text-[11px] text-muted">Subscription Status</div>
                <div className="text-ink font-semibold mt-0.5 font-mono">
                  {tenant.subscription_status ?? "None (Free/Manual)"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-line/60">
                <div className="text-[11px] text-muted">Tenant Identifier</div>
                <div className="text-ink font-mono text-[11px] mt-0.5 truncate">{tenant.id}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Assets */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          {tenant.assets.length === 0 ? (
            <EmptyState icon={<Inbox className="w-5 h-5" />} title="No assets generated yet" />
          ) : (
            <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead>
                    <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                      <th className="p-3.5 font-semibold">TITLE</th>
                      <th className="p-3.5 font-semibold">STATUS</th>
                      <th className="p-3.5 font-semibold">CLAIMS</th>
                      <th className="p-3.5 font-semibold text-right">COST</th>
                      <th className="p-3.5 font-semibold text-right">CREATED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {tenant.assets.map((a) => (
                      <tr key={a.id} className="hover:bg-surface-2/60 transition-colors">
                        <td className="p-3.5 text-ink font-medium max-w-sm truncate">
                          {a.title}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-line">
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-muted text-[11px]">{a.claims_ok}</td>
                        <td className="p-3.5 text-right font-mono tabular-nums text-brand font-semibold">
                          ${a.generation_cost.toFixed(3)}
                        </td>
                        <td className="p-3.5 text-right font-mono tabular-nums text-muted">
                          {formatDate(a.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pipeline Runs */}
      {activeTab === "runs" && (
        <div className="space-y-4">
          {tenant.pipeline_runs.length === 0 ? (
            <EmptyState icon={<Inbox className="w-5 h-5" />} title="No pipeline runs recorded" />
          ) : (
            <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead>
                    <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                      <th className="p-3.5 font-semibold">RUN TYPE</th>
                      <th className="p-3.5 font-semibold">STATUS</th>
                      <th className="p-3.5 font-semibold text-right">STARTED</th>
                      <th className="p-3.5 font-semibold text-right">UPDATED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {tenant.pipeline_runs.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-2/60 transition-colors">
                        <td className="p-3.5 font-mono text-ink font-medium">{r.type}</td>
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-line">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono tabular-nums text-muted">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="p-3.5 text-right font-mono tabular-nums text-muted">
                          {formatDateTime(r.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Ideas */}
      {activeTab === "ideas" && (
        <div className="space-y-4">
          {tenant.ideas.length === 0 ? (
            <EmptyState icon={<Inbox className="w-5 h-5" />} title="No harvested ideas yet" />
          ) : (
            <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead>
                    <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                      <th className="p-3.5 font-semibold">IDEA</th>
                      <th className="p-3.5 font-semibold">PILLAR</th>
                      <th className="p-3.5 font-semibold">STATUS</th>
                      <th className="p-3.5 font-semibold text-right">CREATED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {tenant.ideas.map((i) => (
                      <tr key={i.id} className="hover:bg-surface-2/60 transition-colors">
                        <td className="p-3.5 text-ink max-w-sm truncate font-medium">
                          {i.raw_idea}
                        </td>
                        <td className="p-3.5 font-mono text-muted text-[11px]">{i.pillar}</td>
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-line">
                            {i.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono tabular-nums text-muted">
                          {formatDate(i.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Blog */}
      {activeTab === "blogs" && (
        <div className="space-y-4">
          {tenant.blogs.length === 0 ? (
            <EmptyState icon={<Inbox className="w-5 h-5" />} title="No blog posts published yet" />
          ) : (
            <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                      <th className="p-3.5 font-semibold">TITLE</th>
                      <th className="p-3.5 font-semibold">SLUG</th>
                      <th className="p-3.5 font-semibold text-right">PUBLISHED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {tenant.blogs.map((b) => (
                      <tr key={b.slug} className="hover:bg-surface-2/60 transition-colors">
                        <td className="p-3.5 text-ink font-semibold">{b.title}</td>
                        <td className="p-3.5 font-mono text-muted text-[11px]">{b.slug}</td>
                        <td className="p-3.5 text-right font-mono tabular-nums text-muted">
                          {formatDate(b.published_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-xl shadow-soft text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
