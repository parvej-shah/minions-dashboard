/**
 * Which poster type a cover gets (DECISIONS.md "Five poster types, each with
 * its own background", 2026-11-09). The type follows what the post holds:
 * a list, parallel items, short punches, a figure or quote that stands on
 * its own, or the author's own story when there is a photo. Among the types
 * a post can fill, the one used least recently wins, so a feed keeps
 * changing; the last cover's type is never repeated when another fits.
 */
import type { CoverLayout } from "./layouts";
import type { PosterShape } from "./shape";

/** Most preferred first: a type that shows the post's own structure beats a plain headline. */
export const TYPE_PREFERENCE: CoverLayout[] = ["PHOTO", "NUMBER", "QUOTE", "LIST", "GRID", "PUNCH", "STATEMENT", "HEADLINE"];

/** A face on every cover reads as vanity: at most one photo poster in this many. */
export const PHOTO_EVERY = 4;

export interface PosterTypeInput {
  shape?: PosterShape;
  /** Jev judged the figure or quote to make the point on its own (copy.ts). */
  judged?: { number?: boolean; quote?: boolean };
  /** The author's photo is large enough to fill a poster. */
  photoOk: boolean;
  /** Layouts of this workspace's recent covers, newest first. */
  recent: string[];
  firstPost?: boolean;
}

/** Every type this post could be drawn as, most preferred first. */
export function eligibleTypes(input: PosterTypeInput): CoverLayout[] {
  const s = input.shape;
  const photoRecently = input.recent.slice(0, PHOTO_EVERY - 1).includes("PHOTO");
  const ok: Record<CoverLayout, boolean> = {
    PHOTO: input.photoOk && Boolean(s?.own_story) && !photoRecently,
    NUMBER: Boolean(input.judged?.number),
    QUOTE: Boolean(input.judged?.quote),
    LIST: Boolean(s?.list),
    GRID: Boolean(s?.grid),
    PUNCH: Boolean(s?.punch),
    STATEMENT: true,
    HEADLINE: true,
  };
  return TYPE_PREFERENCE.filter((t) => ok[t]);
}

/**
 * The type to draw. The first post is the photo poster when there is a
 * photo, else the dark Statement (2026-10-01, updated 2026-11-09).
 */
export function pickPosterType(input: PosterTypeInput): CoverLayout {
  if (input.firstPost) return input.photoOk ? "PHOTO" : "STATEMENT";
  const eligible = eligibleTypes(input);
  // A type that shows the post's own structure leads, unless one of the last
  // CONTENT_GAP covers used it; otherwise the headline carries the cover.
  const content = eligible.filter((t) => !HEADLINE_TYPES.includes(t) && !input.recent.slice(0, CONTENT_GAP).includes(t));
  if (content.length) return leastRecent(content, input.recent);
  return leastRecent(HEADLINE_TYPES, input.recent);
}

/** The two types every post can fill: the dark Statement and the light Headline. */
const HEADLINE_TYPES: CoverLayout[] = ["STATEMENT", "HEADLINE"];
/** A structured type waits this many covers before it comes back. */
export const CONTENT_GAP = 2;

/** Least recently used first, ties broken by preference; never the last type when another is possible. */
export function leastRecent(available: CoverLayout[], recent: string[]): CoverLayout {
  const lastUse = (l: CoverLayout) => {
    const i = recent.indexOf(l);
    return i < 0 ? Infinity : i;
  };
  const order = [...available].sort((a, b) => lastUse(b) - lastUse(a) || available.indexOf(a) - available.indexOf(b));
  return order.find((l) => l !== recent[0]) ?? order[0];
}

/** The order to try when the picked type's copy can't fit: the next type, down to HEADLINE. */
export function fallbackOrder(picked: CoverLayout, eligible: CoverLayout[]): CoverLayout[] {
  const rest = eligible.filter((t) => t !== picked && t !== "HEADLINE");
  return [...new Set<CoverLayout>([picked, ...rest, "HEADLINE"])];
}
