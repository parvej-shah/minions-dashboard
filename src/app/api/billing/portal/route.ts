import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";

/**
 * Opens the Stripe Billing Portal so a tenant can update their card, change
 * plan, or cancel without a support ticket. Requires an existing
 * Subscription row (created by the Stripe webhook after a completed
 * checkout) -- there's nothing to manage before a tenant has ever paid.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  if (!isStripeConfigured()) {
    return apiFailure("Billing isn't connected yet.", 503);
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { clientId: ctx.clientId },
      select: { stripeCustomerId: true },
    });
    if (!subscription) {
      return apiFailure("No active subscription to manage yet.", 404);
    }

    const stripe = getStripeClient();
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return apiError(error, "Failed to open the billing portal");
  }
}
