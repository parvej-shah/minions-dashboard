import type { PlanDefinition } from "@/constants/plans";

/**
 * /api/billing response. Stripe isn't wired up yet (see Subscription's
 * schema comment: "No billing is wired up yet"), so `subscription` is null
 * for every tenant today and `stripeConnected` stays false — the page reads
 * this flag to show a placeholder instead of a live "Manage Subscription"
 * button and invoice list.
 *
 * Every tenant without a Subscription row is on a free Starter trial for
 * their first two months (business decision, not yet enforced by billing) —
 * `trialEndsAt` is that window's end, `Client.createdAt + 2 months`.
 */
export interface BillingPayload {
  clientStatus: string;
  subscription: {
    planKey: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: PlanDefinition;
  quota: {
    used: number;
    limit: number;
  };
  stripeConnected: boolean;
  /** Null once a real Subscription exists — the trial window no longer applies. */
  trialEndsAt: string | null;
  /** Computed server-side (not derived from `Date.now()` in the client render,
   *  which React's purity rules disallow) — floored at 0, null when there's
   *  no trial window. */
  trialDaysLeft: number | null;
}
