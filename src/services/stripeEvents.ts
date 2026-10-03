import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, planKeyForPriceId } from "@/lib/stripe";
import type { PlanKey } from "@/constants/plans";

const idOf = (ref: string | { id: string } | null | undefined) => (typeof ref === "string" ? ref : ref?.id);

function subscriptionFields(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return {
    status: subscription.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

const findSubscriptionByCustomer = (customerId: string) =>
  prisma.subscription.findFirst({ where: { stripeCustomerId: customerId }, select: { clientId: true, planKey: true } });

async function checkoutCompleted(session: Stripe.Checkout.Session) {
  const clientId = session.metadata?.clientId;
  const customerId = idOf(session.customer);
  const subscriptionId = idOf(session.subscription);
  if (!clientId || !customerId || !subscriptionId) return;

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const planKey =
    planKeyForPriceId(subscription.items.data[0]?.price.id) ?? (session.metadata?.planKey as PlanKey | undefined) ?? "starter";
  const data = { stripeCustomerId: customerId, stripeSubId: subscriptionId, planKey, ...subscriptionFields(subscription) };

  await prisma.$transaction([
    prisma.subscription.upsert({ where: { clientId }, create: { clientId, ...data }, update: data }),
    prisma.client.update({ where: { id: clientId }, data: { status: "ACTIVE" } }),
  ]);
}

async function subscriptionUpdated(subscription: Stripe.Subscription) {
  const existing = await findSubscriptionByCustomer(idOf(subscription.customer)!);
  if (!existing) return;

  await prisma.subscription.update({
    where: { clientId: existing.clientId },
    data: {
      stripeSubId: subscription.id,
      planKey: planKeyForPriceId(subscription.items.data[0]?.price.id) ?? existing.planKey,
      ...subscriptionFields(subscription),
    },
  });
}

async function subscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await findSubscriptionByCustomer(idOf(subscription.customer)!);
  if (!existing) return;

  await prisma.$transaction([
    prisma.subscription.update({ where: { clientId: existing.clientId }, data: { status: "canceled" } }),
    prisma.client.update({ where: { id: existing.clientId }, data: { status: "CANCELED" } }),
  ]);
}

// 00_tenant_dispatcher only drafts for ACTIVE clients, so PAST_DUE pauses drafting with no separate rate limiter.
async function paymentFailed(invoice: Stripe.Invoice) {
  const customerId = idOf(invoice.customer);
  const existing = customerId ? await findSubscriptionByCustomer(customerId) : null;
  if (existing) await prisma.client.update({ where: { id: existing.clientId }, data: { status: "PAST_DUE" } });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      return checkoutCompleted(event.data.object as Stripe.Checkout.Session);
    case "customer.subscription.updated":
      return subscriptionUpdated(event.data.object as Stripe.Subscription);
    case "customer.subscription.deleted":
      return subscriptionDeleted(event.data.object as Stripe.Subscription);
    case "invoice.payment_failed":
      return paymentFailed(event.data.object as Stripe.Invoice);
  }
}
