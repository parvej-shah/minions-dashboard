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

export const DEFAULT_PALETTE = {
  primaryInk: "#12242A",
  brandTeal: "#0E5C63",
  brandCoral: "#FF6B4A",
  brandCream: "#FFF8F0",
  accentBlue: "#3A6EA5",
} as const;
