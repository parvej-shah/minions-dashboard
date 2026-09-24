import { readFileSync } from "node:fs";
import path from "node:path";
import { readMetrics, type FontMetrics } from "./metrics";

/**
 * The cover type system, the same for every tenant: one consistent face is
 * part of how a reader learns to recognise an author's posts (phase 5
 * decision, 2026-09-24). Newsreader for headlines and quotes, Inter for the
 * label, kicker and author line. Both SIL Open Font License, see fonts/OFL-*.txt.
 */
export type Face = "serif" | "serifItalic" | "sans" | "sansSemi" | "sansBold";

const FILES: Record<Face, { file: string; name: string; weight: 400 | 500 | 600 | 800; style: "normal" | "italic" }> = {
  serif: { file: "newsreader-600-normal.ttf", name: "Newsreader", weight: 600, style: "normal" },
  serifItalic: { file: "newsreader-500-italic.ttf", name: "Newsreader", weight: 500, style: "italic" },
  sans: { file: "inter-400-normal.ttf", name: "Inter", weight: 400, style: "normal" },
  sansSemi: { file: "inter-600-normal.ttf", name: "Inter", weight: 600, style: "normal" },
  sansBold: { file: "inter-800-normal.ttf", name: "Inter", weight: 800, style: "normal" },
};

/** CSS for a face, to spread into a Satori style. */
export const faceStyle = (face: Face) => ({ fontFamily: FILES[face].name, fontWeight: FILES[face].weight, fontStyle: FILES[face].style });

const FONT_DIR = path.join(process.cwd(), "src/lib/covers/fonts");
const data = new Map<Face, Buffer>();
const metrics = new Map<Face, FontMetrics>();

function fontData(face: Face): Buffer {
  let d = data.get(face);
  if (!d) data.set(face, (d = readFileSync(path.join(FONT_DIR, FILES[face].file))));
  return d;
}

export function metricsFor(face: Face): FontMetrics {
  let m = metrics.get(face);
  if (!m) metrics.set(face, (m = readMetrics(fontData(face))));
  return m;
}

/** The font list for ImageResponse. */
export function satoriFonts() {
  return (Object.keys(FILES) as Face[]).map((face) => ({ name: FILES[face].name, data: fontData(face), weight: FILES[face].weight, style: FILES[face].style }));
}
