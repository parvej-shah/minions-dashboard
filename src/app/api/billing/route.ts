import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { findPlan } from "@/constants/plans";
import { isStripeConfigured } from "@/lib/stripe";
import type { BillingPayload } from "@/types";

/**
 * Billing summary for the /settings/billing page.
 *
 * `stripeConnected` mirrors `isStripeConfigured()` (whether STRIPE_SECRET_KEY
 * is set) rather than a hardcoded false, so the page starts rendering the
 * real "Manage Subscription" / invoice-history UI the moment real keys land
 * in `.env.local`, with no further code change. The usage numbers are real
 * regardless, reusing the same Asset-count-vs-plan-limit calculation
 * /api/nav-counts already does, so the two can never disagree.
 *
 * Business decision (2026-08-23): until real billing lands, every tenant
 * gets the Starter plan free for their first two months — there is nowhere
 * a chosen plan_key is persisted yet (see /api/onboarding/client's comment),
 * so this route doesn't try to read one; it always resolves to "starter"
 * while `subscription` is null.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [client, subscription, assetsThisMonth] = await Promise.all([
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { status: true, createdAt: true } }),
      prisma.subscription.findUnique({
        where: { clientId: ctx.clientId },
        select: { planKey: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
      }),
      prisma.asset.count({ where: { clientId: ctx.clientId, createdAt: { gte: startOfMonth } } }),
    ]);

    // No Subscription row exists anywhere yet, so this is always "starter"
    // today — kept as a lookup (not a bare constant) so it starts resolving
    // a tenant's real plan the moment Subscription rows exist, with no
    // change needed here.
    const planKey = subscription?.planKey ?? "starter";
    const plan = findPlan(planKey) ?? findPlan("starter")!;

    let trialEndsAt: string | null = null;
    let trialDaysLeft: number | null = null;
    if (!subscription && client) {
      const end = new Date(client.createdAt);
      end.setMonth(end.getMonth() + 2);
      trialEndsAt = end.toISOString();
      trialDaysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    }

    const payload: BillingPayload = {
      clientStatus: client?.status ?? "TRIAL",
      subscription: subscription
        ? {
            planKey: subscription.planKey,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      plan,
      quota: { used: assetsThisMonth, limit: plan.limits.assetsPerMonth },
      stripeConnected: isStripeConfigured(),
      trialEndsAt,
      trialDaysLeft,
    };

    return NextResponse.json(payload);
  } catch (error) {
    return apiError(error, "Failed to fetch billing summary");
  }
}
