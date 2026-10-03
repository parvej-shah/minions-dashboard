import type { MemoryKind } from "@/constants/contentLanes";

/**
 * Where a harvested idea's seed comes from, and the share of ideas each source
 * should get (docs/product/authority-flywheel-plan.md, phase 3). The mix is
 * enforced in code: the harvest plan picks each slot's seed, and the model is
 * told what to build on rather than asked to balance anything itself.
 */
export const SOURCE_BUCKETS = ["CURRENT_WORK", "EXPERIENCE", "ICP_QUESTION", "MARKET", "EXPERIMENTAL"] as const;
export type SourceBucket = (typeof SOURCE_BUCKETS)[number];

/** Percentages. A tenant may override them (brand_profile.harvest_source_mix). */
export const DEFAULT_SOURCE_MIX: Record<SourceBucket, number> = {
  CURRENT_WORK: 35,
  EXPERIENCE: 25,
  ICP_QUESTION: 20,
  MARKET: 15,
  EXPERIMENTAL: 5,
};

/** What an idea is built on, stored as ideas.source_type. */
const SOURCE_TYPES = [
  "CURRENT_WORK",
  "BUILD_IN_PUBLIC",
  "PAST_EXPERIENCE",
  "PROFESSIONAL_OPINION",
  "ICP_QUESTION",
  "EXPERIMENT",
  "MARKET_SIGNAL",
  "USER_NOTE",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const MEMORY_KIND_SOURCE: Record<MemoryKind, { bucket: SourceBucket; sourceType: SourceType }> = {
  CURRENT_WORK: { bucket: "CURRENT_WORK", sourceType: "CURRENT_WORK" },
  BUILD_IN_PUBLIC: { bucket: "CURRENT_WORK", sourceType: "BUILD_IN_PUBLIC" },
  PAST_EXPERIENCE: { bucket: "EXPERIENCE", sourceType: "PAST_EXPERIENCE" },
  STORY: { bucket: "EXPERIENCE", sourceType: "PAST_EXPERIENCE" },
  LESSON: { bucket: "EXPERIENCE", sourceType: "PAST_EXPERIENCE" },
  OPINION: { bucket: "EXPERIENCE", sourceType: "PROFESSIONAL_OPINION" },
  ICP_QUESTION: { bucket: "ICP_QUESTION", sourceType: "ICP_QUESTION" },
  EXPERIMENT: { bucket: "EXPERIMENTAL", sourceType: "EXPERIMENT" },
};

/** Which bucket a stored idea counts against. USER_NOTE is the human's own pick and counts against none. */
export function bucketOfSourceType(sourceType: string | null | undefined): SourceBucket | null {
  switch (sourceType) {
    case "CURRENT_WORK":
    case "BUILD_IN_PUBLIC":
      return "CURRENT_WORK";
    case "PAST_EXPERIENCE":
    case "PROFESSIONAL_OPINION":
      return "EXPERIENCE";
    case "ICP_QUESTION":
      return "ICP_QUESTION";
    case "EXPERIMENT":
      return "EXPERIMENTAL";
    case "MARKET_SIGNAL":
      return "MARKET";
    default:
      return null;
  }
}

/**
 * Reads a stored override. Anything malformed falls back to the default mix
 * rather than failing a harvest; buckets left out of an override get 0.
 */
export function resolveSourceMix(raw: unknown): Record<SourceBucket, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULT_SOURCE_MIX };
  const out = {} as Record<SourceBucket, number>;
  let total = 0;
  for (const b of SOURCE_BUCKETS) {
    const v = Number((raw as Record<string, unknown>)[b]);
    out[b] = Number.isFinite(v) && v > 0 ? v : 0;
    total += out[b];
  }
  return total > 0 ? out : { ...DEFAULT_SOURCE_MIX };
}
