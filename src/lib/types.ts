// Minions.AI System Type Definitions

export type AudienceLane = "ICP" | "PEER" | "BRIDGE";
export type TargetTrade = "HVAC" | "Plumbing" | "Electrical" | "Roofing" | "Pest Control" | "Voice AI" | "Systems Architecture" | "Operations";
export type ContentPillar = "Operations" | "Engineering" | "Revenue" | "Unit Economics" | "Field Playbook";
export type IdeaSource = "GOOGLE_TRENDS" | "HACKER_NEWS" | "REDDIT_R_LOCALLAMA" | "TRADE_NEWS" | "MANUAL_INJECTION" | "COMPETITOR_INTEL";
export type IdeaStatus = "HARVESTED" | "REFINED" | "PICKED" | "DRAFTING" | "QUEUED" | "FAILED" | "DISCARDED";

export interface IdeaItem {
  id: string;
  raw_idea: string;
  angle: string;
  audience: AudienceLane;
  target_trade?: TargetTrade | string;
  pillar?: ContentPillar | string;
  source: IdeaSource | string;
  status: IdeaStatus;
  estimated_cost?: number;
  created_at: string;
  updated_at: string;
}

export type AssetStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "BLOCKED" | "REJECTED";

export interface ClaimCheckItem {
  id: string;
  claim_text: string;
  source_type: "GO_BENCHMARK" | "VOICE_PACKET_TRACE" | "OPERATOR_DISPATCH_DATA" | "PUBLIC_CRAWL" | "MANUAL_CHECK";
  verified: "Y" | "N" | "NA";
  confidence_score?: number;
  notes?: string;
}

export type SocialPlatform = "LINKEDIN" | "FACEBOOK" | "TWITTER" | "NEWSLETTER";

export interface SocialVariantItem {
  id: string;
  platform: SocialPlatform;
  content: string;
  first_comment?: string;
  published_url?: string;
  status: "DRAFT" | "READY" | "BROADCASTED";
}

export interface AssetItem {
  id: string;
  idea_id?: string;
  title: string;
  slug: string;
  audience: AudienceLane;
  pillar: string;
  hook?: string;
  body_content: string;
  hero_image_url?: string;
  status: AssetStatus;
  claims_verified: boolean;
  doc_url?: string;
  published_at?: string;
  blog_url?: string;
  version: number;
  generation_cost?: number;
  claim_checks?: ClaimCheckItem[];
  social_variants?: SocialVariantItem[];
  created_at: string;
  updated_at: string;
}

// Complete Google Sheet Brand Directive Schema
export type BrandCategory = 
  | "IDENTITY" 
  | "ICP_PROFILE" 
  | "ICP_PAIN" 
  | "POSITIONING" 
  | "PROOF" 
  | "OBJECTION" 
  | "VOICE_DO" 
  | "VOICE_DONT" 
  | "FORBIDDEN" 
  | "CTA" 
  | "PEER_STANCE";

export interface BrandDirectiveItem {
  id: string;
  category: BrandCategory;
  key: string;
  content: string;
  priority: 1 | 2 | 3;
  audience_scope: "ALL" | "ICP" | "PEER" | "BRIDGE";
  is_active: boolean;
  updated_at: string;
}

export interface BrandSettings {
  id: string;
  brand_name: string;
  company_domain: string;
  primary_ink: string;
  brand_teal: string;
  brand_coral: string;
  brand_cream: string;
  accent_blue: string;
  tone_guidelines: {
    formality: "technical_direct" | "tactile_operator" | "conversational_peer";
    cadence: string;
    banned_lexicon: string[];
    allowed_proof_claims: string[];
  };
  thumbnail_layout: {
    visual_style: string;
    show_badge: boolean;
    show_logo: boolean;
    title_word_count_min: number;
    title_word_count_max: number;
  };
  directives?: BrandDirectiveItem[];
  updated_at: string;
}

export interface TelemetryItem {
  id: string;
  asset_id: string;
  strategist_tokens: number;
  writer_tokens: number;
  editor_tokens: number;
  image_model: string;
  image_cost: number;
  total_cost: number;
  latency_seconds: number;
  timestamp: string;
}

export interface AgentWorkerItem {
  id: string;
  name: string;
  role: string;
  type: string;
  model: string;
  status: "ACTIVE" | "IDLE" | "PAUSED";
  system_prompt?: string;
  last_active: string;
  total_runs: number;
}
