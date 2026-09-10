/**
 * Maps the raw `ideas.status` value onto the stage the operator sees.
 *
 * The Idea Stream filtered on HARVESTED / QUEUED / CLAIMED / DRAFTED /
 * PUBLISHED / REJECTED by exact string match, but the pipeline only ever writes
 * REFINED, REVIEW, PICKED and QUEUED. Only QUEUED overlapped, so five of the six
 * filter chips read `0` no matter how many ideas existed, and an idea whose
 * status was REFINED matched no chip at all -- it was in the database and
 * invisible in the UI, which reads as "my idea disappeared".
 *
 * Renaming the database values is not an option: n8n reads and writes them
 * directly in both workflows. So the raw value stays the contract and this
 * translates it for display.
 */
export type IdeaStage = "NEW" | "QUEUED" | "DRAFTING" | "DRAFTED" | "PUBLISHED" | "ARCHIVED";

export const IDEA_STAGES: IdeaStage[] = [
  "NEW",
  "QUEUED",
  "DRAFTING",
  "DRAFTED",
  "PUBLISHED",
  "ARCHIVED",
];

export const IDEA_STAGE_LABELS: Record<IdeaStage, string> = {
  NEW: "New",
  QUEUED: "Queued",
  DRAFTING: "Drafting",
  DRAFTED: "Drafted",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

/** One line of help per stage, so the chips explain the pipeline as you use it. */
export const IDEA_STAGE_HINTS: Record<IdeaStage, string> = {
  NEW: "Harvested and ready to draft",
  QUEUED: "Waiting in the production queue",
  DRAFTING: "A drafting run has claimed this idea",
  DRAFTED: "Draft written, waiting for review",
  PUBLISHED: "Live on your site",
  ARCHIVED: "Rejected or discarded",
};

const STATUS_TO_STAGE: Record<string, IdeaStage> = {
  // Fresh out of the harvester, or refined by the second harvest pass. Both are
  // simply "ready to draft" as far as the operator is concerned.
  HARVESTED: "NEW",
  REFINED: "NEW",
  NEW: "NEW",

  QUEUED: "QUEUED",

  // PICKED is what 02_idea_to_asset sets when it claims a row. CLAIMED and
  // DRAFTING are older spellings of the same state.
  PICKED: "DRAFTING",
  CLAIMED: "DRAFTING",
  DRAFTING: "DRAFTING",

  // REVIEW means the draft exists and is waiting on a human.
  REVIEW: "DRAFTED",
  DRAFTED: "DRAFTED",

  PUBLISHED: "PUBLISHED",

  REJECTED: "ARCHIVED",
  DISCARDED: "ARCHIVED",
  FAILED: "ARCHIVED",
};

/**
 * An unknown status maps to NEW rather than being dropped. A status this build
 * has not seen yet is far more likely to be a new pipeline state than a reason
 * to hide the row -- hiding is what caused the original bug.
 */
export function toIdeaStage(status: string | null | undefined): IdeaStage {
  if (!status) return "NEW";
  return STATUS_TO_STAGE[status.trim().toUpperCase()] ?? "NEW";
}

/**
 * True when a drafting run has claimed this idea but no asset exists yet.
 *
 * These rows are the ones that strand: `POST /api/pipeline/draft` refuses to
 * re-draft anything already PICKED, so a run that dies mid-flight leaves the
 * idea permanently un-draftable with no UI affordance to recover it.
 */
export function isStuckDrafting(
  status: string | null | undefined,
  draftAssetId: string | null | undefined
): boolean {
  return toIdeaStage(status) === "DRAFTING" && !draftAssetId;
}
