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

export type AudienceScope = "ALL" | "ICP" | "PEER" | "BRIDGE";

export interface BrandDirectiveItem {
  id: string;
  category: BrandCategory;
  key: string;
  content: string;
  priority: 1 | 2 | 3;
  audience_scope: AudienceScope;
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

/** A mascot rendered on the Brand Studio mascots tab. */
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

/** A downloadable social cover/avatar template. */
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

/** Tabs of the Brand Studio. */
export type BrandTab = "visuals" | "mascots" | "social" | "directives" | "lexicon";
