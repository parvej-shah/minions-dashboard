import type { BrandSettings } from "@/types";

/**
 * Brand settings served by /api/brand when no override is stored.
 *
 * These are configuration, not sample data: they describe the actual brand and
 * are the values the drafting pipeline reads.
 */
export const DEFAULT_BRAND_SETTINGS: Omit<BrandSettings, "directives" | "updated_at"> = {
  id: "BRAND-MINIONS-01",
  brand_name: "getminions.ai",
  company_domain: "getminions.ai",
  primary_ink: "#12242A",
  brand_teal: "#0E5C63",
  brand_coral: "#FF6B4A",
  brand_cream: "#FFF8F0",
  accent_blue: "#3A6EA5",
  tone_guidelines: {
    formality: "tactile_operator",
    cadence:
      "1–3 sentence paragraphs, zero marketing fluff, Stripe/Linear engineering rigor",
    banned_lexicon: [
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
    ],
    allowed_proof_claims: [
      "Live callable AI voice dispatcher demo",
      "Deterministic JSON schema validation pipeline",
      "Sub-1.8s WebSocket voice turnaround latency",
      "Direct team engineering logs from Dhaka",
    ],
  },
  thumbnail_layout: {
    visual_style:
      "Tactile Commercial Studio Flat-Lay (Stitched leather clipboard, metallic mechanical clip, dark slate tabletop, volumetric rim lighting)",
    show_badge: true,
    show_logo: true,
    title_word_count_min: 3,
    title_word_count_max: 6,
  },
};
