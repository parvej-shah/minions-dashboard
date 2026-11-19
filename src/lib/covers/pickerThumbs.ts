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
  // A saved design has its own tile (designTileId), never a built-in one.
  const head = current === "CUSTOM" ? [] : [current];
  const suggested = [...head, ...usable.filter((l) => l !== current)].slice(0, SUGGESTED);
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

/** The workspace's own designs (task 100): a tile id per design, apart from the built-in layout names. */
const DESIGN_TILE = "design:";
export const designTileId = (id: string) => `${DESIGN_TILE}${id}`;
export const designFromTile = (tile: string): string | null => (tile.startsWith(DESIGN_TILE) && tile.length > DESIGN_TILE.length ? tile.slice(DESIGN_TILE.length) : null);

/** The design the cover uses first, then the rest as listed. */
export function orderDesigns<T extends { id: string }>(designs: T[], currentId: string | undefined): T[] {
  return [...designs.filter((d) => d.id === currentId), ...designs.filter((d) => d.id !== currentId)];
}

/** The tile that shows as picked for this cover. */
export const pickedTile = (cover: { layout: CoverLayout; custom: { id: string; version: number } | null }): string =>
  cover.layout === "CUSTOM" && cover.custom ? designTileId(cover.custom.id) : cover.layout;

/** One live tile in a saved design; the version is in the address, so a new version draws a new tile. */
export const designPreviewUrl = (assetId: string, design: { id: string; version: number }, version: string) =>
  `/api/assets/${assetId}/cover/preview?design=${encodeURIComponent(design.id)}&dv=${design.version}&v=${version}`;

/**
 * What the cover preview shows. Right after a layout is clicked it is the tile
 * the reviewer already sees (`preview`), so the change is instant; once the
 * cover file changes, the real, sharper cover takes over.
 */
export const shownCover = (hero: string | null, preview: { from: string | null; src: string } | null): string | null =>
  preview && preview.from === hero ? preview.src : hero;

/**
 * How many tiles, counted from the first, may ask for their own picture now.
 * The server draws one picture at a time, so asking for all at once makes every
 * tile finish late; asking in order lets each fill in as soon as it is ready.
 * A tile with no live picture, or whose picture already came back (or failed),
 * does not hold up the next one.
 */
export const tilesToDraw = (liveSrcs: (string | undefined)[], settled: ReadonlySet<string>): number => {
  const waiting = liveSrcs.findIndex((s) => s && !settled.has(s));
  return waiting === -1 ? liveSrcs.length : waiting + 1;
};
