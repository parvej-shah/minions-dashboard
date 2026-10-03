import type Stripe from "stripe";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { optionalEnv } from "@/lib/env";
import { handleStripeEvent } from "@/services/stripeEvents";
import { HttpError, badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

// Signature verification needs the raw body and Node's crypto.
export const runtime = "nodejs";

function verifiedEvent(rawBody: string, signature: string, secret: string): Stripe.Event {
  try {
    return getStripeClient().webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed:", error instanceof Error ? error.message : error);
    throw badRequest("Invalid signature");
  }
}

export const POST = route({ auth: "public", failure: "Failed to process the Stripe event" }, async ({ request }) => {
  const webhookSecret = optionalEnv("STRIPE_WEBHOOK_SECRET");
  if (!isStripeConfigured()) throw new HttpError(503, "Stripe is not configured");
  if (!webhookSecret) throw new HttpError(503, "STRIPE_WEBHOOK_SECRET is not configured");
  const signature = request.headers.get("stripe-signature");
  if (!signature) throw badRequest("Missing stripe-signature header");

  const event = verifiedEvent(await request.text(), signature, webhookSecret);

  // A handler bug must not make Stripe retry an event we cannot reprocess differently.
  await handleStripeEvent(event).catch((error) => console.error(`[stripe webhook] handler error for ${event.type}:`, error));
  return { received: true };
});
