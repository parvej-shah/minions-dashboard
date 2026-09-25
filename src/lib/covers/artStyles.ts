/**
 * The cover illustration styles a workspace can pick (src/lib/covers/art.ts).
 * Kept apart from art.ts so the Brand page can list them without shipping
 * the doodle artwork to the browser.
 */
export const COVER_ART_STYLES = ["SHAPES", "DOODLES", "NONE"] as const;
export type CoverArtStyle = (typeof COVER_ART_STYLES)[number];
export const DEFAULT_COVER_ART_STYLE: CoverArtStyle = "SHAPES";

export const COVER_ART_STYLE_META: Record<CoverArtStyle, { label: string; description: string }> = {
  SHAPES: { label: "Shapes", description: "An abstract shape that fits the topic, in your colours" },
  DOODLES: { label: "Doodles", description: "A hand-drawn figure in your ink and accent" },
  NONE: { label: "None", description: "Type only" },
};

export const parseArtStyle = (v: unknown): CoverArtStyle | null =>
  typeof v === "string" && (COVER_ART_STYLES as readonly string[]).includes(v) ? (v as CoverArtStyle) : null;
