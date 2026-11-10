import { DEFAULT_COVER_THEME } from "@/lib/covers/themes";
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

/** New workspaces' cover colours: the default theme (src/lib/covers/themes.ts). */
export const DEFAULT_PALETTE = {
  primaryInk: DEFAULT_COVER_THEME.primary_ink,
  brandTeal: DEFAULT_COVER_THEME.brand_teal,
  brandCoral: DEFAULT_COVER_THEME.brand_coral,
  brandCream: DEFAULT_COVER_THEME.brand_cream,
  accentBlue: "#3A6EA5",
} as const;
