"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Inbox } from "lucide-react";
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

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-muted">
        {title} ({count})
      </h2>
      {children}
    </div>
  );
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: tenant, isLoading, setData } = useApiResource<TenantDetail | null>(
    `/api/platform-admin/tenants/${id}`,
    null,
    { errorMessage: "Could not load tenant" }
  );
  const toast = useToast(4000);
  const [overrideInput, setOverrideInput] = useState<string>("");
  const [savingOverride, setSavingOverride] = useState(false);

  if (isLoading || !tenant) {
    return <LoadingState label="Loading tenant…" />;
  }

  const effectiveCap = tenant.assets_per_month_override ?? tenant.plan_assets_per_month;

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
      toast.show("Usage cap updated.");
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not update usage cap"));
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/platform-admin"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to tenants
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
        <p className="text-sm text-muted mt-1 font-mono">
          {tenant.slug} · {tenant.status} · {tenant.timezone}
        </p>
      </div>

      {/* Usage cap override */}
      <div className="p-5 rounded-2xl bg-surface border border-line space-y-3">
        <h2 className="text-sm font-bold text-ink">Usage cap</h2>
        <p className="text-xs text-muted">
          Plan default (<span className="font-mono">{tenant.plan_key}</span>): {tenant.plan_assets_per_month}{" "}
          assets/month.{" "}
          {tenant.assets_per_month_override !== null ? (
            <>
              Override active: <span className="font-mono text-brand">{effectiveCap}</span> assets/month.
            </>
          ) : (
            <>No override set — using the plan default.</>
          )}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder={tenant.assets_per_month_override !== null ? String(tenant.assets_per_month_override) : "no override"}
            value={overrideInput}
            onChange={(e) => setOverrideInput(e.target.value)}
            className="bg-surface-2 border border-line rounded-xl px-3 py-1.5 text-xs text-ink w-40 focus:outline-none focus:border-brand"
          />
          <button
            onClick={saveOverride}
            disabled={savingOverride}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand/20 hover:bg-brand/30 text-brand border border-brand/40 text-xs font-bold transition-all disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          {tenant.assets_per_month_override !== null && (
            <button
              onClick={() => {
                setOverrideInput("");
                void saveOverride();
              }}
              className="text-[10px] text-subtle hover:text-ink transition-colors"
            >
              clear override
            </button>
          )}
        </div>
        <p className="text-[10px] text-subtle">Leave the field blank and Save to clear an existing override.</p>
      </div>

      <Section title="Pipeline runs" count={tenant.pipeline_runs.length}>
        {tenant.pipeline_runs.length === 0 ? (
          <EmptyState icon={<Inbox className="w-5 h-5" />} title="No pipeline runs yet" />
        ) : (
          <div className="rounded-2xl bg-surface border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[560px]">
                <thead>
                  <tr className="border-b border-line text-muted font-mono text-[11px]">
                    <th className="p-3 font-semibold">TYPE</th>
                    <th className="p-3 font-semibold">STATUS</th>
                    <th className="p-3 font-semibold text-right">STARTED</th>
                    <th className="p-3 font-semibold text-right">UPDATED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {tenant.pipeline_runs.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-2/70 transition-colors">
                      <td className="p-3 font-mono">{r.type}</td>
                      <td className="p-3 font-mono text-muted">{r.status}</td>
                      <td className="p-3 text-right font-mono text-subtle">
                        {formatDateTime(r.created_at)}
                      </td>
                      <td className="p-3 text-right font-mono text-subtle">
                        {formatDateTime(r.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Section title="Assets generated" count={tenant.assets.length}>
        {tenant.assets.length === 0 ? (
          <EmptyState icon={<Inbox className="w-5 h-5" />} title="No assets generated yet" />
        ) : (
          <div className="rounded-2xl bg-surface border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead>
                  <tr className="border-b border-line text-muted font-mono text-[11px]">
                    <th className="p-3 font-semibold">TITLE</th>
                    <th className="p-3 font-semibold">STATUS</th>
                    <th className="p-3 font-semibold">CLAIMS</th>
                    <th className="p-3 font-semibold text-right">COST</th>
                    <th className="p-3 font-semibold text-right">CREATED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {tenant.assets.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-2/70 transition-colors">
                      <td className="p-3 text-ink max-w-xs truncate">{a.title}</td>
                      <td className="p-3 font-mono text-muted">{a.status}</td>
                      <td className="p-3 font-mono text-muted">{a.claims_ok}</td>
                      <td className="p-3 text-right font-mono text-brand">${a.generation_cost.toFixed(3)}</td>
                      <td className="p-3 text-right font-mono text-subtle">
                        {formatDate(a.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Section title="Ideas" count={tenant.ideas.length}>
        {tenant.ideas.length === 0 ? (
          <EmptyState icon={<Inbox className="w-5 h-5" />} title="No ideas harvested yet" />
        ) : (
          <div className="rounded-2xl bg-surface border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead>
                  <tr className="border-b border-line text-muted font-mono text-[11px]">
                    <th className="p-3 font-semibold">IDEA</th>
                    <th className="p-3 font-semibold">PILLAR</th>
                    <th className="p-3 font-semibold">STATUS</th>
                    <th className="p-3 font-semibold text-right">CREATED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {tenant.ideas.map((i) => (
                    <tr key={i.id} className="hover:bg-surface-2/70 transition-colors">
                      <td className="p-3 text-ink max-w-sm truncate">{i.raw_idea}</td>
                      <td className="p-3 font-mono text-muted">{i.pillar}</td>
                      <td className="p-3 font-mono text-muted">{i.status}</td>
                      <td className="p-3 text-right font-mono text-subtle">
                        {formatDate(i.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-xl shadow-soft text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
