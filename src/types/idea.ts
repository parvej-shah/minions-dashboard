export type AudienceLane = "ICP" | "PEER" | "BRIDGE";

export type TargetTrade =
  | "HVAC"
  | "Plumbing"
  | "Electrical"
  | "Roofing"
  | "Pest Control"
  | "Voice AI"
  | "Systems Architecture"
  | "Operations";

export type ContentPillar =
  | "Operations"
  | "Engineering"
  | "Revenue"
  | "Unit Economics"
  | "Field Playbook";

export type IdeaSource =
  | "GOOGLE_TRENDS"
  | "REDDIT"
  | "HACKER_NEWS"
  | "MANUAL"
  | "REDDIT_R_LOCALLAMA"
  | "TRADE_NEWS"
  | "MANUAL_INJECTION"
  | "COMPETITOR_INTEL";

export type IdeaStatus =
  | "HARVESTED"
  | "CLAIMED"
  | "DRAFTED"
  | "PUBLISHED"
  | "REJECTED"
  | "REFINED"
  | "PICKED"
  | "REVIEW"
  | "DRAFTING"
  | "QUEUED"
  | "FAILED"
  | "DISCARDED";

/**
 * The single wire shape for an idea, emitted by every /api/ideas endpoint.
 *
 * Field names are snake_case except the two identifiers that were already
 * camelCase on the client (`ideaId`, `draftAssetId`); those are the canonical
 * spellings now, replacing the `draft_asset_id` variant one route used to emit.
 */
export interface IdeaItem {
  id: string;
  ideaId: string;
  title: string;
  raw_idea: string;
  excerpt: string;
  angle: string;
  audience: AudienceLane;
  target_trade: TargetTrade | string;
  pillar: ContentPillar | string;
  source: IdeaSource | string;
  status: IdeaStatus;
  priority: string | null;
  estimated_cost: number;
  tags: string[];
  scheduled_for: string | null;
  queue_order: number | null;
  draftAssetId: string | null;
  created_at: string;
  updated_at: string;
}

/** A drafting run kicked off from the Ideas page. */
export interface DraftingJob {
  ideaId: string;
  title: string;
  startedAt: number;
}
