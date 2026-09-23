/**
 * The lanes every tenant starts with. A lane is WHAT a tenant publishes and
 * why; an idea's pillar is only its rhetorical angle (see contentAngles.ts).
 *
 * Neutral on purpose: no industry, no trade. The same set is seeded for
 * existing tenants by prisma/sql/2026-09-23-authority-foundation.sql (a test
 * keeps the two identical) and for new tenants on first read of their author
 * context.
 */
export const LANE_PURPOSES = ["AUTHORITY", "CREDIBILITY", "DEMAND"] as const;
export type LanePurpose = (typeof LANE_PURPOSES)[number];

export const PROFILE_TARGETS = ["PERSONAL", "COMPANY", "BOTH"] as const;
export type ProfileTarget = (typeof PROFILE_TARGETS)[number];

export interface DefaultLane {
  slug: string;
  name: string;
  purpose: LanePurpose;
  brief: string;
  weight: number;
  sortOrder: number;
}

export const DEFAULT_LANES: DefaultLane[] = [
  { slug: "icp-problems", name: "ICP Problems", purpose: "AUTHORITY", brief: "A specific problem, question, or decision the ICP faces, and how to think about it.", weight: 3, sortOrder: 1 },
  { slug: "field-lessons", name: "Lessons From the Work", purpose: "CREDIBILITY", brief: "What the author learned from real work: what failed, what changed, what they would do differently.", weight: 2, sortOrder: 2 },
  { slug: "decisions", name: "Decision Guides", purpose: "DEMAND", brief: "Help the ICP choose between options, with the trade-offs named.", weight: 1, sortOrder: 3 },
  // Weight 0: build in public is opt-in (decision in the strategy interview).
  { slug: "build-public", name: "Build in Public", purpose: "CREDIBILITY", brief: "What the author is building or testing right now, and what it taught them.", weight: 0, sortOrder: 4 },
];

/** Deterministic id, so the SQL seed and the lazy seed never create duplicates. */
export function defaultLaneId(clientId: string, slug: string): string {
  return `LANE-${clientId}-${slug}`;
}

export const MEMORY_KINDS = [
  "CURRENT_WORK",
  "PAST_EXPERIENCE",
  "OPINION",
  "STORY",
  "LESSON",
  "ICP_QUESTION",
  "EXPERIMENT",
  "BUILD_IN_PUBLIC",
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

/** No PRIVATE: confidential material is never stored at all (decision D4). */
export const MEMORY_DISCLOSURES = ["PUBLIC", "GENERALIZE"] as const;
export type MemoryDisclosure = (typeof MEMORY_DISCLOSURES)[number];
