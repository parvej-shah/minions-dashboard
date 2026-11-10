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
