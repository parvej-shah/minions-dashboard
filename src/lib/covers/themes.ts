/**
 * Ready-made cover colour themes (tasks/31.md). Picking one sets the four
 * cover colours in one tap. Custom colours stay possible on the Cover look
 * page; a set that matches no theme shows as "Custom".
 *
 * Each theme passes coverBrand's contrast checks unchanged (themes.test.ts),
 * so the colours on a cover are exactly the ones shown in the picker.
 */
export interface CoverTheme {
  id: string;
  label: string;
  /** Text. */
  primary_ink: string;
  /** Paper. */
  brand_cream: string;
  /** The accent word, the quote mark. */
  brand_coral: string;
  /** The big number, the initials badge. */
  brand_teal: string;
}

export const COVER_THEMES: CoverTheme[] = [
  { id: "graphite", label: "Graphite", primary_ink: "#1D1D1F", brand_cream: "#F5F5F7", brand_coral: "#0066CC", brand_teal: "#1D1D1F" },
  { id: "ivory", label: "Ivory", primary_ink: "#1C1A17", brand_cream: "#F7F3EC", brand_coral: "#B4532A", brand_teal: "#3B5B4A" },
  { id: "midnight", label: "Midnight", primary_ink: "#0F1B2D", brand_cream: "#F2F4F7", brand_coral: "#3D5AFE", brand_teal: "#0F1B2D" },
  { id: "forest", label: "Forest", primary_ink: "#16241D", brand_cream: "#F3F1EA", brand_coral: "#2F6B4F", brand_teal: "#A2693B" },
  // The colours every workspace got before themes existed, so their covers keep a name.
  { id: "classic", label: "Classic", primary_ink: "#12242A", brand_cream: "#FFF8F0", brand_coral: "#FF6B4A", brand_teal: "#0E5C63" },
];

/** New workspaces start here: quiet graphite with one blue accent. */
export const DEFAULT_COVER_THEME: CoverTheme = COVER_THEMES[0];

type Colours = Pick<CoverTheme, "primary_ink" | "brand_cream" | "brand_coral" | "brand_teal">;
const KEYS: (keyof Colours)[] = ["primary_ink", "brand_cream", "brand_coral", "brand_teal"];

/** The theme these colours are, or null when they are custom. Case-insensitive. */
export function themeOf(colours: Partial<Colours>): CoverTheme | null {
  return COVER_THEMES.find((t) => KEYS.every((k) => (colours[k] ?? "").toUpperCase() === t[k].toUpperCase())) ?? null;
}

/** Just a theme's four colours, ready to merge into a brand profile. */
export function themeColours(theme: CoverTheme): Colours {
  return { primary_ink: theme.primary_ink, brand_cream: theme.brand_cream, brand_coral: theme.brand_coral, brand_teal: theme.brand_teal };
}
