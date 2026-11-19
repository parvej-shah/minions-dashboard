/**
 * The cover fonts a workspace can pick on the Brand page (task 97). Plain
 * data, safe for the browser; fonts.ts loads the files. All SIL Open Font
 * License, chosen for the modern display look (wide, condensed, quirky,
 * technical, editorial) at no licence cost.
 */
export const COVER_FONTS = {
  bricolage: { label: "Bricolage", about: "Friendly and bold", name: "Bricolage Grotesque", bold: ["bricolage-800-normal.ttf", 800], semi: ["bricolage-600-normal.ttf", 600] },
  anton: { label: "Anton", about: "Tall and loud", name: "Anton", bold: ["anton-400-normal.ttf", 400], semi: ["anton-400-normal.ttf", 400] },
  unbounded: { label: "Unbounded", about: "Wide and modern", name: "Unbounded", bold: ["unbounded-800-normal.ttf", 800], semi: ["unbounded-600-normal.ttf", 600] },
  syne: { label: "Syne", about: "Quirky and artful", name: "Syne", bold: ["syne-800-normal.ttf", 800], semi: ["syne-600-normal.ttf", 600] },
  space: { label: "Space Grotesk", about: "Sharp and technical", name: "Space Grotesk", bold: ["spacegrotesk-700-normal.ttf", 700], semi: ["spacegrotesk-500-normal.ttf", 500] },
  dmserif: { label: "DM Serif", about: "Editorial serif", name: "DM Serif Display", bold: ["dmserif-display-400-normal.ttf", 400], semi: ["dmserif-display-400-normal.ttf", 400] },
} as const satisfies Record<string, { label: string; about: string; name: string; bold: readonly [string, number]; semi: readonly [string, number] }>;

export type CoverFontId = keyof typeof COVER_FONTS;
export const COVER_FONT_IDS = Object.keys(COVER_FONTS) as CoverFontId[];
export const DEFAULT_COVER_FONT: CoverFontId = "bricolage";
export const isCoverFont = (v: unknown): v is CoverFontId => typeof v === "string" && Object.prototype.hasOwnProperty.call(COVER_FONTS, v);

/** The workspace's cover font, kept in brandProfile.visualAssets.cover_font. */
export function readCoverFont(visualAssets: unknown): CoverFontId {
  const v = (visualAssets as { cover_font?: unknown } | null)?.cover_font;
  return isCoverFont(v) ? v : DEFAULT_COVER_FONT;
}
