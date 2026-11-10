/**
 * Which poster type a cover gets (DECISIONS.md "Five poster types, each with
 * its own background", 2026-11-09). The type follows what the post holds:
 * a list, parallel items, short punches, a figure or quote that stands on
 * its own, or the author's own story when there is a photo. Among the types
 * a post can fill, the one used least recently wins, so a feed keeps
 * changing; the last cover's type is never repeated when another fits.
 */
import type { CoverLayout } from "./layouts";
import { BANNER_DESIGNS } from "./bannerTypes";
import type { PosterShape } from "./shape";

/** Most preferred first: a type that shows the post's own structure beats a plain headline. */
export const TYPE_PREFERENCE: CoverLayout[] = ["PHOTO", "NUMBER", "QUOTE", "LIST", "GRID", "PUNCH", "CUTOUT", "STATEMENT", "HIGHLIGHT", "SWISS", "SIDEWAYS", "ECHO", "BOLD", "SPLIT", "MAGAZINE", "BENTO", "TAGGED", "NEON", "TORN", "SELECT", "STICKER", "NOTEBOOK", "NOTES", "POSTCARD", "CIRCLED", "HEADLINE"];

/** A face on every cover reads as vanity: at most one face poster (Photo or Cut-out) in this many. */
export const PHOTO_EVERY = 4;

export interface PosterTypeInput {
  shape?: PosterShape;
  /** Jev judged the figure or quote to make the point on its own (copy.ts). */
  judged?: { number?: boolean; quote?: boolean };
  /** The author's photo is large enough to fill a poster. */
  photoOk: boolean;
  /** The brand has a cut-out photo (transparent background) for the Cut-out banner. */
  cutoutOk?: boolean;
  /** Layouts of this workspace's recent covers, newest first. */
  recent: string[];
  firstPost?: boolean;
}

/** Every type this post could be drawn as, most preferred first. */
export function eligibleTypes(input: PosterTypeInput): CoverLayout[] {
  const s = input.shape;
  const faceRecently = input.recent.slice(0, PHOTO_EVERY - 1).some((t) => t === "PHOTO" || t === "CUTOUT");
  const ok: Record<CoverLayout, boolean> = {
    PHOTO: input.photoOk && Boolean(s?.own_story) && !faceRecently,
    NUMBER: Boolean(input.judged?.number),
    QUOTE: Boolean(input.judged?.quote),
    LIST: Boolean(s?.list),
    GRID: Boolean(s?.grid),
    PUNCH: Boolean(s?.punch),
    STATEMENT: true,
    HEADLINE: true,
    // The banner types carry the headline, so every post can fill them (Torn
    // falls through when there is no subtitle to reveal).
    TORN: true,
    SELECT: true,
    STICKER: true,
    NOTEBOOK: true,
    NOTES: true,
    POSTCARD: true,
    CIRCLED: true,
    CUTOUT: Boolean(input.cutoutOk) && !faceRecently,
    HIGHLIGHT: true,
    SWISS: true,
    SIDEWAYS: true,
    ECHO: true,
    BOLD: true,
    SPLIT: true,
    MAGAZINE: true,
    BENTO: true,
    TAGGED: true,
    NEON: true,
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
  // CONTENT_GAP covers used it or the last cover was already one: then a
  // headline or banner type carries the cover, so the feed alternates.
  const lastWasContent = Boolean(input.recent[0]) && !HEADLINE_TYPES.includes(input.recent[0] as CoverLayout);
  const content = eligible.filter((t) => !HEADLINE_TYPES.includes(t) && !input.recent.slice(0, CONTENT_GAP).includes(t));
  if (content.length && !lastWasContent) return leastRecent(content, input.recent);
  const headline = eligible.filter((t) => HEADLINE_TYPES.includes(t));
  return leastRecent(headline, input.recent);
}

/** The types that carry the headline alone, so any post can fill them: Statement, Headline and the banners. */
export const HEADLINE_TYPES: CoverLayout[] = ["STATEMENT", "HEADLINE", ...BANNER_DESIGNS];
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
