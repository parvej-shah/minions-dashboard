import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/lib/api-response";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { optionalEnv } from "@/lib/env";
import { PLANS, type PlanKey } from "@/constants/plans";

// Stripe's signature verification needs the raw request body and Node's
// crypto module -- the edge runtime's default body parsing and SubtleCrypto
// API don't support this without extra plumbing, so this route is pinned to
// the Node runtime rather than trying to make constructEventAsync work here.
export const runtime = "nodejs";

/** Reverse-lookup: which of our plan keys does this Stripe price belong to? */
function planKeyForPriceId(priceId: string | undefined): PlanKey | null {
  if (!priceId) return null;
  for (const plan of PLANS) {
    if (optionalEnv(`STRIPE_PRICE_${plan.key.toUpperCase()}`) === priceId) return plan.key;
  }
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clientId = session.metadata?.clientId;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!clientId || !customerId || !subscriptionId) return;

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const planKey = planKeyForPriceId(priceId) ?? (session.metadata?.planKey as PlanKey | undefined) ?? "starter";
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { clientId },
      create: {
        clientId,
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId,
        planKey,
        status: subscription.status,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId,
        planKey,
        status: subscription.status,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    }),
    prisma.client.update({ where: { id: clientId }, data: { status: "ACTIVE" } }),
  ]);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id;
  const planKey = planKeyForPriceId(priceId);
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  const existing = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { clientId: true, planKey: true },
  });
  if (!existing) return; // No checkout.session.completed seen for this customer yet.

  await prisma.subscription.update({
    where: { clientId: existing.clientId },
    data: {
      stripeSubId: subscription.id,
      planKey: planKey ?? existing.planKey,
      status: subscription.status,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const existing = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { clientId: true },
  });
  if (!existing) return;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { clientId: existing.clientId },
      data: { status: "canceled" },
    }),
    prisma.client.update({ where: { id: existing.clientId }, data: { status: "CANCELED" } }),
  ]);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const existing = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { clientId: true },
  });
  if (!existing) return;

  // This is the actual enforcement mechanism: 00_tenant_dispatcher only
  // fans out to clients with status ACTIVE, so PAST_DUE excludes a tenant
  // from new draft generation without a separate rate-limiter.
  await prisma.client.update({ where: { id: existing.clientId }, data: { status: "PAST_DUE" } });
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return apiFailure("Stripe is not configured", 503);
  }

  const webhookSecret = optionalEnv("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return apiFailure("STRIPE_WEBHOOK_SECRET is not configured", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return apiFailure("Missing stripe-signature header", 400);
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe webhook] signature verification failed:", message);
    return apiFailure("Invalid signature", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Unhandled event types are fine to ignore -- Stripe retries are
        // keyed on a 2xx response, not on us recognizing every event type.
        break;
    }
  } catch (err) {
    // Log and still 200: a bug in one handler shouldn't make Stripe
    // infinitely retry an event whose data we've already seen and can't
    // reprocess differently next time.
    console.error(`[stripe webhook] handler error for ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}
