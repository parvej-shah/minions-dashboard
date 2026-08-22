/**
 * Plan tiers: mechanism only, no dollar amounts here. Actual prices live in
 * Stripe (Products/Prices); planKey is the only thing shared between the two
 * systems, referenced by stripePriceId at checkout time. Mirrors the existing
 * MODEL_RATE_CARD pattern in src/constants/config.ts — a static map, not a DB
 * table, so a limit change doesn't need a migration.
 */
export type PlanKey = "starter" | "growth" | "scale";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  description: string;
  /** Env var name holding this plan's Stripe Price ID. Read lazily via optionalEnv. */
  stripePriceEnvVar: string;
  limits: {
    ideasPerWeek: number;
    assetsPerMonth: number;
    channels: number;
  };
}

export const PLANS: readonly PlanDefinition[] = [
  {
    key: "starter",
    name: "Starter",
    description: "One channel, light cadence. Good for testing the voice match before committing.",
    stripePriceEnvVar: "STRIPE_PRICE_STARTER",
    limits: { ideasPerWeek: 3, assetsPerMonth: 8, channels: 1 },
  },
  {
    key: "growth",
    name: "Growth",
    description: "Full omnichannel cadence across blog and social.",
    stripePriceEnvVar: "STRIPE_PRICE_GROWTH",
    limits: { ideasPerWeek: 6, assetsPerMonth: 20, channels: 3 },
  },
  {
    key: "scale",
    name: "Scale",
    description: "Highest volume, all channels, priority queue position.",
    stripePriceEnvVar: "STRIPE_PRICE_SCALE",
    limits: { ideasPerWeek: 14, assetsPerMonth: 60, channels: 4 },
  },
] as const;

export function findPlan(key: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.key === key);
}
