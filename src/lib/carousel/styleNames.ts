import type { SlideStyle } from "./slides";

/** The carousel designs a reviewer can pick, with a hint at what each looks like. Every SlideStyle must be listed. */
export const STYLE_META: Record<SlideStyle, { name: string; hint: string }> = {
  EDITORIAL: { name: "Editorial", hint: "Calm, strong-colour open and close" },
  BOLD: { name: "Bold", hint: "Every page in your strong colour" },
  MINIMAL: { name: "Minimal", hint: "Plain and quiet" },
  POSTER: { name: "Poster", hint: "Dark and light pages, a ribbon across them" },
  SWISS: { name: "Swiss", hint: "Column grid, italic key word" },
  AURORA: { name: "Aurora", hint: "Dark, colour glows, glass panel" },
  BENTO: { name: "Bento", hint: "Cards on a soft grey page" },
};

/** The design's name; plans stored before designs existed were drawn in Editorial. */
export function styleName(style: string | null | undefined): string {
  return STYLE_META[(style ?? "EDITORIAL") as SlideStyle]?.name ?? STYLE_META.EDITORIAL.name;
}
