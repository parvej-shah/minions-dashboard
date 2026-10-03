"use client";

import { useState } from "react";
import {
  CreditCard,
  ExternalLink,
  FileText,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Gift,
  RefreshCw,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { PLANS, type PlanKey } from "@/constants/plans";
import type { BillingPayload } from "@/types";

import { buttonStyles } from "@/components/ui/Button";
import { formatDate } from "@/utils/date";
const EMPTY_PAYLOAD: BillingPayload = {
  clientStatus: "TRIAL",
  subscription: null,
  plan: PLANS[0],
  quota: { used: 0, limit: PLANS[0].limits.assetsPerMonth },
  stripeConnected: false,
  trialEndsAt: null,
  trialDaysLeft: null,
};

export default function BillingPage() {
  const { data, isLoading } = useApiResource<BillingPayload>("/api/billing", EMPTY_PAYLOAD, {
    errorMessage: "Could not load billing details",
  });
  const toast = useToast(4000);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  function navigateTo(url: string) {
    window.location.assign(url);
  }

  const openPortal = async () => {
    setPendingAction("portal");
    try {
      const res = await apiClient.post<{ url: string }>("/api/billing/portal", {});
      navigateTo(res.url);
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not open the billing portal"));
      setPendingAction(null);
    }
  };

  const startCheckout = async (planKey: PlanKey) => {
    setPendingAction(planKey);
    try {
      const res = await apiClient.post<{ url: string }>("/api/billing/checkout", { plan_key: planKey });
      navigateTo(res.url);
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not start checkout"));
      setPendingAction(null);
    }
  };

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
      <div className="border-b border-line pb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-brand uppercase mb-1">
          <CreditCard className="w-3.5 h-3.5" />
          Billing &amp; Usage
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Subscription</h1>
        <p className="text-sm text-muted mt-1">
          Your current plan, this month&apos;s usage, and account status.
        </p>
      </div>

      {/* FREE TRIAL BANNER — every tenant gets Starter free for 2 months until billing is live */}
      {trialEndsAt && (
        <div className="p-4 rounded-2xl bg-brand/10 border border-brand/30 flex items-center gap-3">
          <Gift className="w-5 h-5 text-brand shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-ink">You&apos;re on a free Starter trial.</span>{" "}
            <span className="text-muted">
              {trialDaysLeft !== null && trialDaysLeft > 0
                ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                : "Trial period has ended"}{" "}
              — no card required, ends {formatDate(trialEndsAt)}.
            </span>
          </div>
        </div>
      )}

      {/* CURRENT PLAN */}
      <div className="p-6 rounded-2xl bg-surface border border-line space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">{plan.name} Plan</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30 uppercase">
                {subscription ? subscription.status : trialEndsAt ? "FREE TRIAL" : clientStatus}
              </span>
            </div>
            <p className="text-xs text-muted mt-1 max-w-md">{plan.description}</p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] font-mono text-subtle">
              {plan.limits.ideasPerWeek} ideas/wk · {plan.limits.assetsPerMonth} posts/mo ·{" "}
              {plan.limits.channels} channel{plan.limits.channels > 1 ? "s" : ""}
            </div>
            {subscription?.currentPeriodEnd && (
              <div className="text-[11px] font-mono text-subtle mt-0.5">
                {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} {formatDate(subscription.currentPeriodEnd)}
              </div>
            )}
          </div>
        </div>

        {/* USAGE METER */}
        <div className="space-y-1.5 pt-4 border-t border-line/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted">Posts used this month</span>
            <span className="font-bold text-ink">
              {quota.used} / {quota.limit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-canvas overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                quota.used >= quota.limit
                  ? "bg-danger"
                  : pct >= 80
                    ? "bg-gold"
                    : "bg-brand"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* MANAGE SUBSCRIPTION — live once Stripe is configured, placeholder until then */}
        <div className="pt-4 border-t border-line/60">
          {stripeConnected ? (
            <button
              onClick={openPortal}
              disabled={pendingAction === "portal"}
              className={buttonStyles({ size: "sm" })}
            >
              {pendingAction === "portal" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span>Manage Subscription</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                disabled
                title="Stripe billing isn't connected yet"
                className="inline-flex items-center gap-2 bg-surface-2 border border-line text-subtle text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Manage Subscription</span>
              </button>
              <span className="text-[11px] font-mono text-subtle">
                Stripe billing portal — coming soon
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PLAN COMPARISON */}
      <div className="p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-ink">Available Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const isCurrent = p.key === plan.key;
            return (
              <div
                key={p.key}
                className={`p-4 rounded-xl border space-y-2 ${
                  isCurrent ? "border-brand bg-brand/5" : "border-line bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">{p.name}</span>
                  {isCurrent && <CheckCircle2 className="w-4 h-4 text-brand" />}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">{p.description}</p>
                <div className="text-[11px] font-mono text-subtle">
                  {p.limits.ideasPerWeek} ideas/wk · {p.limits.assetsPerMonth} posts/mo ·{" "}
                  {p.limits.channels} channel{p.limits.channels > 1 ? "s" : ""}
                </div>
                {stripeConnected && !isCurrent && (
                  <button
                    onClick={() => startCheckout(p.key)}
                    disabled={pendingAction === p.key}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-brand text-[11px] font-bold transition-all disabled:opacity-60"
                  >
                    {pendingAction === p.key ? "Redirecting…" : `Switch to ${p.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!stripeConnected && (
          <p className="text-[11px] text-subtle flex items-center gap-1.5">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            Plan changes will be available from the Manage Subscription portal once Stripe is connected.
          </p>
        )}
      </div>

      {/* INVOICE HISTORY — placeholder until Stripe is wired up */}
      <div className="p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand" />
          Invoice History
        </h3>
        <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-xl border border-dashed border-line bg-canvas/40">
          <p className="text-xs text-muted max-w-sm">
            {stripeConnected
              ? "Manage invoices from the Stripe Billing Portal via “Manage Subscription” above."
              : "Invoices will appear here once Stripe billing is connected to this account."}
          </p>
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
