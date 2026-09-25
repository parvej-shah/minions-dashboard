import { DEFAULT_WRITER_EXPERTISE } from "@/constants/writerExpertise";
import type { BrandSettings } from "@/types";
import { BRAND_POSITIONING, PRIMARY_LOGO_URL } from "@/constants/config";

/**
 * Forbidden-word list for the drafting pipeline's voice prompt.
 *
 * Not stored in `brand_profile` / not editable from the Brand Profile tab —
 * out of scope until the Brand Studio Lexicon tab is wired to persist.
 */
export const STATIC_BANNED_LEXICON = [
  "seamless",
  "game-changing",
  "revolutionize",
  "unlock",
  "synergy",
  "delve",
  "testament",
  "tapestry",
  "in today's fast-paced world",
  "the future of",
  "🚀",
];

/**
 * Brand settings served by /api/brand when no `brand_profile` row is stored yet.
 *
 * Once a row exists in the database, these values are only the seed used to
 * create it — the database is the source of truth from then on.
 */
export const DEFAULT_BRAND_SETTINGS: Omit<BrandSettings, "directives" | "updated_at"> = {
  id: "BRAND-MINIONS-01",
  brand_name: "getminions.ai",
  company_domain: "getminions.ai",
  positioning: BRAND_POSITIONING,
  primary_logo_url: PRIMARY_LOGO_URL,
  cover_byline: "",
  cover_art: "SHAPES",
  primary_ink: "#12242A",
  brand_teal: "#0E5C63",
  brand_coral: "#FF6B4A",
  brand_cream: "#FFF8F0",
  accent_blue: "#3A6EA5",
  tone_guidelines: {
    formality: "tactile_operator",
    cadence:
      "1–3 sentence paragraphs, zero marketing fluff, Stripe/Linear engineering rigor",
    banned_lexicon: STATIC_BANNED_LEXICON,
    allowed_proof_claims: [
      "Live callable AI voice dispatcher demo",
      "Deterministic JSON schema validation pipeline",
      "Sub-1.8s WebSocket voice turnaround latency",
      "Direct team engineering logs from Dhaka",
    ],
  },
  writer_expertise: DEFAULT_WRITER_EXPERTISE,
  thumbnail_layout: {
    visual_style:
      "Tactile Commercial Studio Flat-Lay (Stitched leather clipboard, metallic mechanical clip, dark slate tabletop, volumetric rim lighting)",
    show_badge: true,
    show_logo: true,
    title_word_count_min: 3,
    title_word_count_max: 6,
  },
};
