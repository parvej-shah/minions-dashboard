/**
 * Drawing a stored cover in another layout: whether it can be, with what copy,
 * and which copy to try when the first does not fit. Pure, so the real layout
 * edit (services/cover.ts) and the picker's live tiles (services/coverPreview.ts)
 * obey the same rules: a tile never offers a layout the click would refuse.
 */
import { COVER_LAYOUTS, type CoverLayout, type CoverSpec } from "./layouts";
import { isBanner } from "./bannerTypes";
import { DEFAULT_COVER_FONT } from "./coverFonts";
import { pickQuote, quoteSource } from "./copy";
import type { PosterShape } from "./shape";

/** The poster's items from the shape; each layout draws only its own. */
export const posterParts = (shape?: PosterShape) => ({ list: shape?.list?.items, grid: shape?.grid?.items, punch: shape?.punch });

/** Layouts that need a part of the shape, and what to say when the post lacks it. */
export const NEEDS_SHAPE: Partial<Record<CoverLayout, { part: "list" | "grid" | "punch"; missing: string }>> = {
  LIST: { part: "list", missing: "This post does not name 3 or 4 separate points for a List cover." },
  GRID: { part: "grid", missing: "This post does not name 3 to 6 parallel things for a Grid cover." },
  PUNCH: { part: "punch", missing: "This post has no short punch lines for a Punch cover." },
};

export interface SwitchContext {
  shape?: PosterShape;
  /** The brand headshot: whether there is one, and whether it can fill a Photo cover. */
  photo: { present: boolean; ok: boolean };
  /** The brand has a usable cut-out photo. */
  cutout: boolean;
  body: string;
  post: string | null;
}

export type SwitchResult = { ok: true; spec: CoverSpec } | { ok: false; error: string };

/** `spec` drawn as `layout`, or why it cannot be. The copy is the post's own, never re-picked. */
export function switchLayout(spec: CoverSpec, layout: CoverLayout, ctx: SwitchContext): SwitchResult {
  if (!(COVER_LAYOUTS as readonly string[]).includes(layout)) return { ok: false, error: `Unknown layout ${layout}` };
  let next: CoverSpec = { ...spec, ...posterParts(ctx.shape) };
  const need = NEEDS_SHAPE[layout];
  if (need && !ctx.shape?.[need.part]) return { ok: false, error: need.missing };
  if (layout === "PHOTO" && !ctx.photo.ok) {
    return { ok: false, error: ctx.photo.present ? "The brand photo can't fill a Photo cover: it needs an opaque headshot at least 600 px wide (a logo with a transparent background won't do)." : "Add a headshot on the Brand page to use the Photo cover." };
  }
  if (layout === "CUTOUT" && !ctx.cutout) return { ok: false, error: "Add a cut-out photo (a PNG with a transparent background) on the Brand page to use the Cut-out cover." };
  if (layout === "TORN" && !next.kicker) return { ok: false, error: "A Torn cover needs a subtitle for the strip to reveal. Add one first." };
  if (layout === "NUMBER" && !next.number) return { ok: false, error: "This draft has no verified figure for a NUMBER cover." };
  if (layout === "QUOTE") {
    const quote = pickQuote(quoteSource({ body: ctx.body, post: ctx.post }));
    if (!quote) return { ok: false, error: "No sentence in the post works as a pull quote." };
    next = { ...next, quote };
  }
  return { ok: true, spec: { ...next, layout } };
}

/**
 * Specs to try, best first. A spec throws CoverFitError when its copy cannot
 * fit; the next one drops the kicker, then uses the title, then the plain
 * HEADLINE layout, so a draft always gets a cover when any honest copy fits.
 */
export function attempts(spec: CoverSpec, title: string): CoverSpec[] {
  // Each option is tried with the illustration first, then without it: the
  // headline and subtitle carry the post, the picture does not. Before any
  // shorter copy, the same words are tried in the default font (task 101):
  // a wide brand font must not cost the post its words.
  return copyAttempts(spec, title).flatMap((s) => fontAttempts(s).flatMap((f) => (f.art ? [f, { ...f, art: undefined }] : [f])));
}

/** The brand's cover font, then the default one. A custom design sets its own fonts. */
const fontAttempts = (s: CoverSpec): CoverSpec[] =>
  s.layout !== "CUSTOM" && s.font && s.font !== DEFAULT_COVER_FONT ? [s, { ...s, font: DEFAULT_COVER_FONT }] : [s];

function copyAttempts(spec: CoverSpec, title: string): CoverSpec[] {
  const out = [spec];
  if (spec.kicker) out.push({ ...spec, kicker: undefined });
  if (title && title !== spec.headline) out.push({ ...spec, layout: spec.layout === "QUOTE" || spec.layout === "NUMBER" ? "HEADLINE" : spec.layout, headline: title, emphasis: undefined, kicker: undefined, quote: undefined, number: undefined });
  const plain: CoverSpec = { ...spec, layout: "HEADLINE", headline: title || spec.headline, emphasis: undefined, kicker: undefined, quote: undefined, number: undefined, label: undefined };
  // Last: one line over the limit, because a draft without a cover is worse than a long headline.
  out.push(plain, { ...plain, looseHeadline: true });
  return out;
}

/** Only the attempts that keep the layout and the headline's own length. */
export const sameType = (s: CoverSpec, title: string) => attempts(s, title).filter((a) => a.layout === s.layout && !a.looseHeadline);

/**
 * What to try when a reviewer asks for this layout: a poster, banner or photo
 * type keeps its type (no fallback to a plain headline); the rest may fall back.
 */
export const editAttempts = (spec: CoverSpec, title: string): CoverSpec[] =>
  NEEDS_SHAPE[spec.layout] || spec.layout === "PHOTO" || spec.layout === "CUSTOM" || isBanner(spec.layout) ? sameType(spec, title) : attempts(spec, title);
