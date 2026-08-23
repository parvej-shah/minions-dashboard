import Stripe from "stripe";
import { optionalEnv } from "./env";

/**
 * Stripe isn't set up yet for this app — no account, no products, no
 * webhook endpoint registered. Every billing route in this codebase reads
 * `isStripeConfigured()` / `getStripeClient()` from here rather than
 * `requireEnv()`, so the app builds and runs today with billing fully
 * disabled, and starts working the moment real keys land in `.env.local`
 * with no code changes needed elsewhere.
 */
export function isStripeConfigured(): boolean {
  return Boolean(optionalEnv("STRIPE_SECRET_KEY"));
}

let client: Stripe | null = null;

/** Throws if Stripe isn't configured — callers must check isStripeConfigured() first. */
export function getStripeClient(): Stripe {
  const key = optionalEnv("STRIPE_SECRET_KEY");
  if (!key) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local to enable billing."
    );
  }
  if (!client) {
    client = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
  }
  return client;
}

/** Per-plan Stripe Price IDs, set once products/prices exist in the Stripe dashboard. */
export function getStripePriceId(planKey: string): string | undefined {
  const envName = `STRIPE_PRICE_${planKey.toUpperCase()}`;
  return optionalEnv(envName);
}
