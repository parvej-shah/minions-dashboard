"use client";

import {
  CreditCard,
  ExternalLink,
  FileText,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Gift,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { PLANS } from "@/constants/plans";
import type { BillingPayload } from "@/types";

const EMPTY_PAYLOAD: BillingPayload = {
  clientStatus: "TRIAL",
  subscription: null,
  plan: PLANS[0],
  quota: { used: 0, limit: PLANS[0].limits.assetsPerMonth },
  stripeConnected: false,
  trialEndsAt: null,
  trialDaysLeft: null,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BillingPage() {
  const { data, isLoading } = useApiResource<BillingPayload>("/api/billing", EMPTY_PAYLOAD, {
    errorMessage: "Could not load billing details",
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <LoadingState label="Loading billing details…" />
      </div>
    );
  }

  const { clientStatus, subscription, plan, quota, stripeConnected, trialEndsAt, trialDaysLeft } = data;
  const pct = quota.limit > 0 ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="border-b border-[#1F2D3D] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
          <CreditCard className="w-3.5 h-3.5" />
          Billing &amp; Usage
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">Subscription</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Your current plan, this month&apos;s usage, and account status.
        </p>
      </div>

      {/* FREE TRIAL BANNER — every tenant gets Starter free for 2 months until billing is live */}
      {trialEndsAt && (
        <div className="p-4 rounded-2xl bg-[#00C9A7]/10 border border-[#00C9A7]/30 flex items-center gap-3">
          <Gift className="w-5 h-5 text-[#00C9A7] shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#F1F5F9]">You&apos;re on a free Starter trial.</span>{" "}
            <span className="text-[#94A3B8]">
              {trialDaysLeft !== null && trialDaysLeft > 0
                ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                : "Trial period has ended"}{" "}
              — no card required, ends {formatDate(trialEndsAt)}.
            </span>
          </div>
        </div>
      )}

      {/* CURRENT PLAN */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#F1F5F9]">{plan.name} Plan</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30 uppercase">
                {subscription ? subscription.status : trialEndsAt ? "FREE TRIAL" : clientStatus}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-md">{plan.description}</p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] font-mono text-[#64748B]">
              {plan.limits.ideasPerWeek} ideas/wk · {plan.limits.assetsPerMonth} posts/mo ·{" "}
              {plan.limits.channels} channel{plan.limits.channels > 1 ? "s" : ""}
            </div>
            {subscription?.currentPeriodEnd && (
              <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} {formatDate(subscription.currentPeriodEnd)}
              </div>
            )}
          </div>
        </div>

        {/* USAGE METER */}
        <div className="space-y-1.5 pt-4 border-t border-[#1F2D3D]/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#94A3B8]">Posts used this month</span>
            <span className="font-bold text-[#F1F5F9]">
              {quota.used} / {quota.limit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#070B0F] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                quota.used >= quota.limit
                  ? "bg-[#EF4444]"
                  : pct >= 80
                    ? "bg-[#F59E0B]"
                    : "bg-[#00C9A7]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* MANAGE SUBSCRIPTION — placeholder until Stripe is wired up */}
        <div className="pt-4 border-t border-[#1F2D3D]/60">
          {stripeConnected ? (
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              <span>Manage Subscription</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div className="flex items-center gap-3">
              <button
                disabled
                title="Stripe billing isn't connected yet"
                className="inline-flex items-center gap-2 bg-[#161D26] border border-[#1F2D3D] text-[#64748B] text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Manage Subscription</span>
              </button>
              <span className="text-[11px] font-mono text-[#64748B]">
                Stripe billing portal — coming soon
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PLAN COMPARISON */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#F1F5F9]">Available Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div
              key={p.key}
              className={`p-4 rounded-xl border space-y-2 ${
                p.key === plan.key
                  ? "border-[#00C9A7] bg-[#00C9A7]/5"
                  : "border-[#1F2D3D] bg-[#161D26]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#F1F5F9]">{p.name}</span>
                {p.key === plan.key && <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />}
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">{p.description}</p>
              <div className="text-[11px] font-mono text-[#64748B]">
                {p.limits.ideasPerWeek} ideas/wk · {p.limits.assetsPerMonth} posts/mo ·{" "}
                {p.limits.channels} channel{p.limits.channels > 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
          <ArrowUpRight className="w-3 h-3 shrink-0" />
          Plan changes will be available from the Manage Subscription portal once Stripe is connected.
        </p>
      </div>

      {/* INVOICE HISTORY — placeholder until Stripe is wired up */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00C9A7]" />
          Invoice History
        </h3>
        <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-xl border border-dashed border-[#1F2D3D] bg-[#070B0F]/40">
          <p className="text-xs text-[#94A3B8] max-w-sm">
            Invoices will appear here once Stripe billing is connected to this account.
          </p>
        </div>
      </div>
    </div>
  );
}
