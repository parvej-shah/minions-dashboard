import Stripe from "stripe";
import { optionalEnv } from "./env";
import { PLANS, type PlanKey } from "@/constants/plans";

// Billing is optional: every caller checks isStripeConfigured() so the app runs with Stripe unset.
export function isStripeConfigured(): boolean {
  return Boolean(optionalEnv("STRIPE_SECRET_KEY"));
}

let client: Stripe | null = null;

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

export function getStripePriceId(planKey: string): string | undefined {
  const envName = `STRIPE_PRICE_${planKey.toUpperCase()}`;
  return optionalEnv(envName);
}

export function planKeyForPriceId(priceId: string | undefined): PlanKey | null {
  if (!priceId) return null;
  return PLANS.find((plan) => getStripePriceId(plan.key) === priceId)?.key ?? null;
}
