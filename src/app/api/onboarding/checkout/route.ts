import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { optionalEnv } from "@/lib/env";
import { apiError, apiFailure } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { findPlan } from "@/constants/plans";
import { prisma } from "@/lib/prisma";

/**
 * Starts Stripe Checkout for the signed-in user's Client, or — while no
 * Stripe keys are configured yet — skips straight to the next onboarding
 * step so the rest of the wizard can be built and tested without billing
 * wired in. Once STRIPE_SECRET_KEY and the plan's price env var are set,
 * this activates automatically, no code change needed.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.clientId) return apiFailure("Unauthorized", 401);

  try {
    const body = await request.json();
    const plan = findPlan((body.plan_key || "").toString());
    if (!plan) return apiFailure(`Unknown plan_key: ${body.plan_key}`, 400);

    const stripe = getStripe();
    const priceId = optionalEnv(plan.stripePriceEnvVar);

    if (!stripe || !priceId) {
      return NextResponse.json({
        configured: false,
        redirect_url: "/onboarding/setup",
      });
    }

    const client = await prisma.client.findUnique({ where: { id: user.clientId } });
    if (!client) return apiFailure("Client not found", 404);

    const appUrl = optionalEnv("NEXT_PUBLIC_APP_URL") || "https://minions.getminions.ai";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: client.id,
      success_url: `${appUrl}/onboarding/setup?checkout=success`,
      cancel_url: `${appUrl}/onboarding?checkout=cancelled`,
      metadata: { client_id: client.id, plan_key: plan.key },
    });

    return NextResponse.json({ configured: true, redirect_url: session.url });
  } catch (error) {
    return apiError(error, "Failed to start checkout");
  }
}
