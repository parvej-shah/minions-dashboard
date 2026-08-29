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

export type AudienceScope = "ALL" | "ICP" | "PEER" | "BRIDGE";

export interface BrandDirectiveItem {
  id: string;
  category: BrandCategory;
  key: string;
  content: string;
  priority: 1 | 2 | 3 | number;
  audience_scope: AudienceScope;
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
  updated_at: string;
}

export interface BrandProfileInput {
  brand_name: string;
  company_domain: string;
  positioning: string;
  primary_logo_url: string;
  primary_ink: string;
  brand_teal: string;
  brand_coral: string;
  brand_cream: string;
  accent_blue: string;
  tone_formality: "technical_direct" | "tactile_operator" | "conversational_peer" | string;
  tone_cadence: string;
  allowed_proof_claims: string[];
  visual_assets?: VisualAssets;
}

export type BrandTab = "overview" | "lexicon";
