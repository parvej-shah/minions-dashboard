import { prisma } from "@/lib/prisma";
import { getStripeClient, getStripePriceId, isStripeConfigured } from "@/lib/stripe";
import { findPlan } from "@/constants/plans";
import { badRequest, HttpError, notFound } from "@/server/http/errors";
import { countAssetsThisMonth, monthlyAssetLimit, resolvePlan } from "@/services/quota";
import type { BillingPayload } from "@/types";

const TRIAL_MONTHS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

function trialWindow(createdAt: Date) {
  const end = new Date(createdAt);
  end.setMonth(end.getMonth() + TRIAL_MONTHS);
  return { trialEndsAt: end.toISOString(), trialDaysLeft: Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY_MS)) };
}

export async function getBillingSummary(clientId: string): Promise<BillingPayload> {
  const [client, subscription, assetsThisMonth] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { status: true, createdAt: true, assetsPerMonthOverride: true } }),
    prisma.subscription.findUnique({
      where: { clientId },
      select: { planKey: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
    }),
    countAssetsThisMonth(clientId),
  ]);

  const plan = resolvePlan(subscription?.planKey);
  const trial = !subscription && client ? trialWindow(client.createdAt) : { trialEndsAt: null, trialDaysLeft: null };

  return {
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
    quota: { used: assetsThisMonth, limit: monthlyAssetLimit(plan, client?.assetsPerMonthOverride) },
    stripeConnected: isStripeConfigured(),
    ...trial,
  };
}

function requireStripe(message: string) {
  if (!isStripeConfigured()) throw new HttpError(503, message);
}

export async function startCheckout(clientId: string, user: { email: string }, planKey: string, origin: string) {
  requireStripe("Billing isn't connected yet. Contact support to upgrade your plan.");
  const plan = findPlan(planKey);
  if (!plan) throw badRequest(`Unknown plan_key: ${planKey}`);
  const priceId = getStripePriceId(plan.key);
  if (!priceId) throw new HttpError(503, `No Stripe price configured for the "${plan.key}" plan yet.`);

  const stripe = getStripeClient();
  const [client, existing] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
    prisma.subscription.findUnique({ where: { clientId }, select: { stripeCustomerId: true } }),
  ]);

  // The webhook writes the Subscription row, so a customer created here and then abandoned is harmless.
  const customerId =
    existing?.stripeCustomerId ??
    (await stripe.customers.create({ email: user.email, name: client?.name, metadata: { clientId } })).id;

  const metadata = { clientId, planKey: plan.key };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/billing?checkout=success`,
    cancel_url: `${origin}/settings/billing?checkout=cancelled`,
    metadata,
    subscription_data: { metadata },
  });
  return { url: session.url };
}

export async function openBillingPortal(clientId: string, origin: string) {
  requireStripe("Billing isn't connected yet.");
  const subscription = await prisma.subscription.findUnique({ where: { clientId }, select: { stripeCustomerId: true } });
  if (!subscription) throw notFound("No active subscription to manage yet.");

  const session = await getStripeClient().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${origin}/settings/billing`,
  });
  return { url: session.url };
}
