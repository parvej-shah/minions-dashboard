export type AudienceLane = "ICP" | "PEER" | "BRIDGE";
export type IdeaStatus = "HARVESTED" | "REFINED" | "QUEUED" | "REJECTED";
export type AssetStatus = "DRAFTED" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHING" | "PUBLISHED" | "REJECTED";
export type SocialPlatform = "LINKEDIN" | "FACEBOOK" | "TWITTER";
export type PublishStatus = "DRAFT" | "PUBLISHED" | "FAILED";
export type AgentType = "MARKETING_STRATEGIST" | "CONTENT_WRITER" | "EDITORIAL_REVIEWER" | "VOICE_DISPATCHER" | "SALES_OUTREACH" | "BACKOFFICE_OPS";
export type AgentStatus = "ACTIVE" | "IDLE" | "PAUSED" | "ERROR";

export interface IdeaItem {
  id: string;
  raw_idea: string;
  angle: string;
  audience: AudienceLane;
  target_trade: string;
  pillar: string;
  source: string;
  status: IdeaStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AssetItem {
  id: string;
  idea_id?: string;
  title: string;
  slug: string;
  hook?: string;
  core_argument?: string;
  body_content: string;
  audience: AudienceLane;
  pillar: string;
  status: AssetStatus;
  version: number;
  claims_verified: boolean;
  hero_image_url?: string;
  r2_object_key?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  social_variants?: SocialVariantItem[];
  claim_checks?: ClaimCheckItem[];
  telemetry?: TelemetryItem[];
}

export interface SocialVariantItem {
  id: string;
  asset_id: string;
  platform: SocialPlatform;
  content: string;
  first_comment?: string;
  published_id?: string;
  published_url?: string;
  status: PublishStatus;
  error_log?: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimCheckItem {
  id: string;
  asset_id: string;
  claim_text: string;
  source_type: string;
  verified: boolean;
  notes?: string;
  created_at: string;
}

export interface TelemetryItem {
  id: string;
  asset_id: string;
  stage: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
}

export interface BrandSettings {
  id: string;
  brand_name: string;
  primary_ink: string;
  brand_teal: string;
  brand_coral: string;
  brand_cream: string;
  logo_url?: string;
  watermark_url?: string;
  thumbnail_layout?: {
    show_badge: boolean;
    show_logo: boolean;
    title_word_count_min: number;
    title_word_count_max: number;
    visual_style: string;
  };
  updated_at: string;
}

export interface AgentWorkerItem {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  system_prompt?: string;
  model: string;
  last_active_at?: string;
  created_at: string;
}
