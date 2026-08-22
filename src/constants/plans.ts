/**
 * Plan tiers: limits only, no billing wired up yet. planKey is kept as the
 * one shared identifier so a real billing integration (Stripe or otherwise)
 * can be layered on later without touching Client/Subscription — it just
 * needs to reference planKey the same way this does.
 */
export type PlanKey = "starter" | "growth" | "scale";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  description: string;
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
    limits: { ideasPerWeek: 3, assetsPerMonth: 8, channels: 1 },
  },
  {
    key: "growth",
    name: "Growth",
    description: "Full omnichannel cadence across blog and social.",
    limits: { ideasPerWeek: 6, assetsPerMonth: 20, channels: 3 },
  },
  {
    key: "scale",
    name: "Scale",
    description: "Highest volume, all channels, priority queue position.",
    limits: { ideasPerWeek: 14, assetsPerMonth: 60, channels: 4 },
  },
] as const;

export function findPlan(key: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.key === key);
}
