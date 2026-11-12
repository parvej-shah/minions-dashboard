/**
 * What the Studio's cover layout and carousel design pickers show
 * (tasks/41.md): a sample picture of every choice (drawn by
 * scripts/picker-thumbs.ts), and which layouts to offer this cover.
 * Client-safe: no drawing code is imported here.
 */
import type { CoverLayout } from "./layouts";
import type { SlideStyle } from "@/lib/carousel/slides";
import { layoutUnavailable, type LayoutFacts } from "./available";
import { TYPE_PREFERENCE } from "./posterType";

/** Under public/. */
export const PICKER_THUMB_DIR = "images/pickers";

export const coverThumb = (layout: CoverLayout) => `/${PICKER_THUMB_DIR}/cover-${layout.toLowerCase()}.webp`;
export const carouselThumb = (style: SlideStyle) => `/${PICKER_THUMB_DIR}/carousel-${style.toLowerCase()}.webp`;

const SUGGESTED = 4;

/**
 * The layouts this cover can be drawn in: up to four "for this post" (the
 * current one, then the ones the post's own content fills, then plain
 * headline designs), and the rest. A layout that can't be drawn is left out,
 * never offered greyed out; the current one is always kept.
 */
export function pickerLayouts(current: CoverLayout, facts: LayoutFacts, opts: { checking?: boolean } = {}): { suggested: CoverLayout[]; rest: CoverLayout[] } {
  const usable = TYPE_PREFERENCE.filter((l) => l === current || !layoutUnavailable(l, facts, opts));
  const suggested = [current, ...usable.filter((l) => l !== current)].slice(0, SUGGESTED);
  return { suggested, rest: usable.filter((l) => !suggested.includes(l)) };
}

/** The cover words a tile is drawn from. The chosen layout is not one of them. */
export interface PreviewText {
  /** Ignored: the version must not change when another layout is picked. */
  layout?: string;
  headline: string;
  emphasis: string | null;
  kicker: string | null;
  quote: string | null;
  number: { value: string; unit?: string } | null;
  list: string[] | null;
  grid: { label: string; icon: string }[] | null;
  punch: { lines: string[]; checks: string[] } | null;
  art_style: string | null;
  author: { name: string; role: string | null } | null;
}

/**
 * Names the words and look a tile was drawn from, so the browser reuses a tile
 * until the post's own text changes. Picking another layout leaves it alone.
 */
export function previewVersion(cover: PreviewText): string {
  const s = JSON.stringify([cover.headline, cover.emphasis, cover.kicker, cover.quote, cover.number, cover.list, cover.grid, cover.punch, cover.art_style, cover.author]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** One live tile: this post's own words drawn in `layout` (GET, cacheable per version). */
export const coverPreviewUrl = (assetId: string, layout: CoverLayout, version: string) => `/api/assets/${assetId}/cover/preview?layout=${layout}&v=${version}`;
