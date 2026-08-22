import Stripe from "stripe";
import { optionalEnv } from "./env";

/**
 * Stripe client, or null when no key is configured.
 *
 * Real Stripe keys don't exist yet (early scaffolding phase), so every
 * caller has to handle the null case explicitly rather than the app failing
 * to build/boot without them. Once STRIPE_SECRET_KEY is set in the
 * environment, checkout and the webhook route activate automatically — no
 * code change needed.
 */
let client: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (client !== undefined) return client;

  const key = optionalEnv("STRIPE_SECRET_KEY");
  client = key ? new Stripe(key) : null;
  return client;
}

export function isStripeConfigured(): boolean {
  return getStripe() !== null;
}
