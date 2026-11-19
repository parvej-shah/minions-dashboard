import { ImageResponse } from "next/og";
import satori from "satori";
import { metricsFor, satoriFonts, withCoverFont, type Face } from "./fonts";
import { COVER_SIZE, coverElement, type CoverSpec } from "./layouts";

/** Renders a cover to PNG. Throws CoverFitError when the copy cannot fit. */
export function renderCoverPng(spec: CoverSpec): Promise<Buffer> {
  return withCoverFont(spec.font, async () => {
    // coverElement runs every fit, so a CoverFitError throws here, before any drawing.
    const element = coverElement(spec);
    const res = new ImageResponse(element, { ...COVER_SIZE, fonts: satoriFonts(spec.layout === "CUSTOM") });
    return Buffer.from(await res.arrayBuffer());
  });
}

/**
 * The cover as the SVG Satori lays out, before any rasterizing: text as
 * shapes, so it needs no fonts to show. For the layout picker's tiles only
 * (tasks/58.md): the browser draws it at tile size, which takes a few ms,
 * where rasterizing the full 1080x1350 cover took up to 2 s. satori is pinned
 * to the version next/og bundles, so a tile matches the real cover. Unlike
 * next/og it fetches no fallback letters; check needsFallbackGlyphs first.
 * Throws CoverFitError when the copy cannot fit.
 */
export function renderCoverSvg(spec: CoverSpec): Promise<string> {
  return withCoverFont(spec.font, () => satori(coverElement(spec), { ...COVER_SIZE, fonts: satoriFonts(spec.layout === "CUSTOM") }));
}

const FACES: Face[] = ["serif", "serifItalic", "sans", "sansSemi", "sansBold", "italic"];

/** Every word the cover may set, whatever the layout. */
function coverText(spec: CoverSpec): string {
  return [
    spec.label,
    spec.headline,
    spec.emphasis,
    spec.kicker,
    spec.quote,
    spec.number?.value,
    spec.number?.unit,
    spec.author.name,
    spec.author.role,
    ...(spec.list ?? []),
    ...(spec.grid ?? []).map((g) => g.label),
    ...(spec.punch?.lines ?? []),
    ...(spec.punch?.checks ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Whether the cover's words hold a letter one of our fonts lacks (another
 * script, an emoji). next/og fetches such letters for the real cover; a bare
 * satori SVG would leave them out, so those tiles take the raster path.
 */
export function needsFallbackGlyphs(spec: CoverSpec): boolean {
  return withCoverFont(spec.font, () => lacksGlyph(spec));
}

function lacksGlyph(spec: CoverSpec): boolean {
  for (const ch of new Set(coverText(spec))) {
    const cp = ch.codePointAt(0)!;
    if (/\s/.test(ch)) continue;
    if (FACES.some((face) => metricsFor(face).advance(cp) === 0)) return true;
  }
  return false;
}
