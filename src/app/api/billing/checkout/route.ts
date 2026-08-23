import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { getStripeClient, getStripePriceId, isStripeConfigured } from "@/lib/stripe";
import { findPlan } from "@/constants/plans";

/**
 * Starts a Stripe Checkout session for the caller's tenant to subscribe to
 * (or change to) a paid plan. Returns 503 until Stripe is actually
 * configured (STRIPE_SECRET_KEY + a per-plan STRIPE_PRICE_<PLAN> env var) —
 * see src/lib/stripe.ts. Every tenant is free on Starter today (see
 * /api/billing's trial-window logic), so this route only matters once
 * someone wants to move onto a paid tier.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  if (!isStripeConfigured()) {
    return apiFailure("Billing isn't connected yet. Contact support to upgrade your plan.", 503);
  }

  try {
    const body = await request.json();
    const planKey = (body.plan_key || "").toString().trim();
    const plan = findPlan(planKey);
    if (!plan) return apiFailure(`Unknown plan_key: ${planKey}`, 400);

    const priceId = getStripePriceId(plan.key);
    if (!priceId) {
      return apiFailure(`No Stripe price configured for the "${plan.key}" plan yet.`, 503);
    }

    const stripe = getStripeClient();
    const [client, existingSubscription] = await Promise.all([
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { name: true } }),
      prisma.subscription.findUnique({
        where: { clientId: ctx.clientId },
        select: { stripeCustomerId: true },
      }),
    ]);

    // Reuse the existing Stripe customer once one exists (created on this
    // tenant's first checkout attempt); the webhook is what actually writes
    // the Subscription row, so a customer created here but abandoned before
    // completing checkout is harmless — just an unused Stripe customer.
    let customerId = existingSubscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ctx.user.email,
        name: client?.name,
        metadata: { clientId: ctx.clientId },
      });
      customerId = customer.id;
    }

    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings/billing?checkout=success`,
      cancel_url: `${origin}/settings/billing?checkout=cancelled`,
      metadata: { clientId: ctx.clientId, planKey: plan.key },
      subscription_data: { metadata: { clientId: ctx.clientId, planKey: plan.key } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return apiError(error, "Failed to start checkout");
  }
}
