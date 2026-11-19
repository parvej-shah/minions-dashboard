import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import path from "node:path";
import { COVER_FONTS, COVER_FONT_IDS, DEFAULT_COVER_FONT, isCoverFont, type CoverFontId } from "./coverFonts";
import { readMetrics, type FontMetrics } from "./metrics";

/**
 * The cover type system. Headlines and quotes use the workspace's cover font
 * (Brand page, task 97; Bricolage Grotesque ExtraBold by default); the label,
 * kicker and author line stay Plus Jakarta Sans, and Instrument Serif Italic
 * is the emphasised word on the modern banner types. Every face is SIL Open
 * Font License (fonts/OFL-*.txt), cut to a static TTF from the Google Fonts
 * variable files, since Satori and the width metrics need static TTFs.
 *
 * "serif" and "serifItalic" are roles, not fonts: the cover font's heavy and
 * semi-bold cut. Which cover font they mean is set per render with
 * withCoverFont, held in AsyncLocalStorage so two workspaces rendering at the
 * same time never borrow each other's font.
 */
export { COVER_FONTS, COVER_FONT_IDS, DEFAULT_COVER_FONT, isCoverFont, readCoverFont, type CoverFontId } from "./coverFonts";

/** Every family name a cover may use (custom designs may name any of them). */
export const FONT_FAMILIES = [...new Set([...COVER_FONT_IDS.map((id) => COVER_FONTS[id].name), "Plus Jakarta Sans", "Instrument Serif"])];

/** A role ("serif" = the cover font's heavy cut) or a specific cover font's cut ("anton.bold"). */
export type Face = "serif" | "serifItalic" | "sans" | "sansSemi" | "sansBold" | "italic" | `${CoverFontId}.${"bold" | "semi"}`;

interface FontFile {
  file: string;
  name: string;
  weight: number;
  style: "normal" | "italic";
}

const BODY: Record<"sans" | "sansSemi" | "sansBold" | "italic", FontFile> = {
  sans: { file: "jakarta-400-normal.ttf", name: "Plus Jakarta Sans", weight: 400, style: "normal" },
  sansSemi: { file: "jakarta-600-normal.ttf", name: "Plus Jakarta Sans", weight: 600, style: "normal" },
  sansBold: { file: "jakarta-800-normal.ttf", name: "Plus Jakarta Sans", weight: 800, style: "normal" },
  italic: { file: "instrument-serif-400-italic.ttf", name: "Instrument Serif", weight: 400, style: "italic" },
};

const cut = (id: CoverFontId, which: "bold" | "semi"): FontFile => {
  const [file, weight] = COVER_FONTS[id][which];
  return { file, name: COVER_FONTS[id].name, weight, style: "normal" };
};

const current = new AsyncLocalStorage<CoverFontId>();

/** The cover font in force for this render (Bricolage outside withCoverFont). */
export const activeCoverFont = (): CoverFontId => current.getStore() ?? DEFAULT_COVER_FONT;

/** Runs fn with the given cover font as "serif"/"serifItalic". An unknown id means the default. */
export function withCoverFont<T>(font: unknown, fn: () => T): T {
  return current.run(isCoverFont(font) ? font : DEFAULT_COVER_FONT, fn);
}

function fileOf(face: Face): FontFile {
  if (face === "serif") return cut(activeCoverFont(), "bold");
  if (face === "serifItalic") return cut(activeCoverFont(), "semi");
  if (face in BODY) return BODY[face as keyof typeof BODY];
  const [id, which] = face.split(".") as [CoverFontId, "bold" | "semi"];
  return cut(isCoverFont(id) ? id : DEFAULT_COVER_FONT, which === "semi" ? "semi" : "bold");
}

/** CSS for a face, to spread into a Satori style. */
export const faceStyle = (face: Face) => {
  const f = fileOf(face);
  return { fontFamily: f.name, fontWeight: f.weight, fontStyle: f.style };
};

const FONT_DIR = path.join(process.cwd(), "src/lib/covers/fonts");
const data = new Map<string, Buffer>();
const metrics = new Map<string, FontMetrics>();

function fontData(file: string): Buffer {
  let d = data.get(file);
  if (!d) data.set(file, (d = readFileSync(path.join(FONT_DIR, file))));
  return d;
}

export function metricsFor(face: Face): FontMetrics {
  const { file } = fileOf(face);
  let m = metrics.get(file);
  if (!m) metrics.set(file, (m = readMetrics(fontData(file))));
  return m;
}

/**
 * The font list for Satori: the body faces and this render's cover font, or
 * every cover font when `all` (a custom design may name any of them). Fewer
 * fonts keep the picker tiles fast.
 */
export function satoriFonts(all = false) {
  const ids = all ? COVER_FONT_IDS : [activeCoverFont()];
  const files = [...Object.values(BODY), ...ids.flatMap((id) => [cut(id, "bold"), cut(id, "semi")])];
  const seen = new Set<string>();
  return files
    .filter((f) => !seen.has(f.file) && seen.add(f.file))
    .map((f) => ({ name: f.name, data: fontData(f.file), weight: f.weight as 400 | 500 | 600 | 700 | 800, style: f.style }));
}
