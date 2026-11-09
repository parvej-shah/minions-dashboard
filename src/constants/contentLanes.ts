/**
 * The lanes every tenant starts with. A lane is WHAT a tenant publishes and
 * why; an idea's pillar is only its rhetorical angle (see contentAngles.ts).
 *
 * Neutral on purpose: no industry, no trade. The same set is seeded for
 * existing tenants by prisma/sql/2026-09-23-authority-foundation.sql (a test
 * keeps the two identical) and for new tenants on first read of their author
 * context.
 */
const LANE_PURPOSES = ["AUTHORITY", "CREDIBILITY", "DEMAND"] as const;
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

/** What each memory kind means, shown in the Experience editor. */
export const MEMORY_KIND_META: Record<MemoryKind, { label: string; hint: string }> = {
  CURRENT_WORK: { label: "Current work", hint: "What you are building or doing right now." },
  PAST_EXPERIENCE: { label: "Past experience", hint: "Roles, industries and projects behind you." },
  STORY: { label: "Story", hint: "Something that happened, with a before and after." },
  LESSON: { label: "Lesson", hint: "What failed or surprised you, and what you changed." },
  OPINION: { label: "Opinion", hint: "A view you hold that others in your field might not." },
  ICP_QUESTION: { label: "Customer question", hint: "A question your customers keep asking." },
  EXPERIMENT: { label: "Experiment", hint: "Something you are testing, and what you have seen so far." },
  BUILD_IN_PUBLIC: { label: "Build in public", hint: "Progress you are happy to share openly." },
};

export const MEMORY_DISCLOSURE_META: Record<MemoryDisclosure, { label: string; hint: string }> = {
  PUBLIC: { label: "Public", hint: "Minions may mention the specifics." },
  GENERALIZE: { label: "Generalize", hint: "Use the lesson, never names, places or figures." },
};

export const MEMORY_MIN_CHARS = 20;
export const MEMORY_MAX_CHARS = 1000;
export const MAX_MEMORY_ITEMS = 200;
/** Each ICP list (pains, decisions, ...) is capped so the prompt stays bounded. */
export const ICP_LIST_MAX = 8;

/** How the ICP buys: for the result (most business owners) or for how it works (technical buyers). */
export const ICP_BUYERS = ["OUTCOME", "TECHNICAL"] as const;
export type IcpBuyer = (typeof ICP_BUYERS)[number];

/** The ICP's buyer type: OUTCOME unless it says TECHNICAL (profiles saved before the switch have none). */
export function icpBuyer(icp: { buyer?: unknown } | null | undefined): IcpBuyer {
  return icp?.buyer === "TECHNICAL" ? "TECHNICAL" : "OUTCOME";
}
export const ICP_ITEM_MAX_CHARS = 200;
