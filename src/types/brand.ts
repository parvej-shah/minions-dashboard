import type { WriterExpertise } from "@/constants/writerExpertise";

/**
 * Collapsed from a 17-value taxonomy (IDENTITY/ICP_PROFILE/ICP_PAIN/POSITIONING/
 * PROOF/OBJECTION/VOICE_DO/VOICE_DONT/CTA/PEER_STANCE/EDITORIAL_PHILOSOPHY/
 * CONTENT_THEMES/AUDIENCE_LANES/CONTENT_RULES/WRITING_STYLE/BRAND_PERSONA) down
 * to 5 plain buckets. Only FORBIDDEN is functionally special-cased anywhere
 * (merged into tone_guidelines.banned_lexicon) -- every other category was
 * just a display label, so consolidating them is a pure UI simplification.
 */
export type BrandCategory =
  | "POSITIONING"
  | "TOPICS"
  | "AUDIENCE"
  | "VOICE"
  | "FORBIDDEN";

import type { AudienceScope, RetiredAudienceScope } from "@/constants/audience";
export type { AudienceScope } from "@/constants/audience";

export interface BrandDirectiveItem {
  id: string;
  category: BrandCategory;
  key: string;
  content: string;
  priority: 1 | 2 | 3 | number;
  /** Retired values only appear on old, deactivated rows. */
  audience_scope: AudienceScope | RetiredAudienceScope;
  is_active: boolean;
  updated_at: string;
}

export interface MascotItem {
  id: string;
  name: string;
  codename: string;
  role: string;
  trade: string;
  model: string;
  description: string;
  avatar_path: string;
  full_asset_path: string;
  status: string;
  skills: string[];
}

export interface SocialTemplateItem {
  id: string;
  platform: string;
  type: "COVER" | "AVATAR";
  name: string;
  dimensions: string;
  theme: string;
  path: string;
  description: string;
}

export interface VisualAssets {
  socialCovers?: SocialTemplateItem[];
  mascots?: MascotItem[];
}

export interface BrandSettings {
  id: string;
  brand_name: string;
  company_domain: string;
  positioning: string;
  primary_logo_url: string;
  /** The author line under the name on every cover; empty uses the positioning's first sentence. */
  cover_byline: string;
  /** The illustration above a cover's headline: SHAPES, DOODLES or NONE. */
  cover_art: string;
  primary_ink: string;
  brand_teal: string;
  brand_coral: string;
  brand_cream: string;
  accent_blue: string;
  tone_guidelines: {
    formality: "technical_direct" | "tactile_operator" | "conversational_peer" | string;
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
  visual_assets?: VisualAssets;
  /** How deep the AUTHOR is in the field; drives evidence and assertiveness, not reading level. */
  writer_expertise: WriterExpertise;
  updated_at: string;
}

export interface BrandProfileInput {
  brand_name: string;
  company_domain: string;
  positioning: string;
  primary_logo_url: string;
  /** Omitted: left as it is. */
  cover_byline?: string;
  /** Omitted: left as it is. */
  cover_art?: string;
  primary_ink: string;
  brand_teal: string;
  brand_coral: string;
  brand_cream: string;
  accent_blue: string;
  tone_formality: "technical_direct" | "tactile_operator" | "conversational_peer" | string;
  tone_cadence: string;
  allowed_proof_claims: string[];
  visual_assets?: VisualAssets;
  writer_expertise?: WriterExpertise;
}

export interface BrandVoiceQuestionnaire {
  formality: "casual" | "balanced" | "formal";
  sentence_length: "short" | "mixed" | "long";
  humor: "none" | "light" | "frequent";
  emoji_use: "never" | "sometimes" | "often";
  signature_phrases: string[];
}

export interface BrandToneExample {
  id: string;
  content: string;
  source: string | null;
}

export interface BrandProofItem {
  id: string;
  claim: string;
  source_url: string;
  source_title: string;
  notes: string;
}

export interface BrandVoiceProofSettings {
  questionnaire: BrandVoiceQuestionnaire;
  examples: BrandToneExample[];
  proofs: BrandProofItem[];
}

export type BrandTab = "overview" | "experience" | "voice-proof" | "lexicon" | "sources";
