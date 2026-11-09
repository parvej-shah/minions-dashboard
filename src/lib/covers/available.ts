/**
 * Which cover layouts the Studio offers. A layout the cover can't be drawn
 * in is disabled with the reason, never offered and then refused on click.
 */
import type { CoverLayout } from "./layouts";

/** What a cover knows about its post and brand (a subset of CoverSpecDTO). */
export interface LayoutFacts {
  shape_read: boolean;
  list: string[] | null;
  grid: { label: string; icon: string }[] | null;
  punch: { lines: string[]; checks: string[] } | null;
  number: { value: string; unit?: string } | null;
  photo_ok: boolean;
  quote_ok: boolean;
}

const NEEDS_POINTS: Partial<Record<CoverLayout, { has: (f: LayoutFacts) => boolean; missing: string }>> = {
  LIST: { has: (f) => Boolean(f.list?.length), missing: "The post doesn't name 3 or 4 separate points" },
  GRID: { has: (f) => Boolean(f.grid?.length), missing: "The post doesn't name 3 to 6 parallel things" },
  PUNCH: { has: (f) => Boolean(f.punch), missing: "The post has no short punch lines" },
};

/** Why `layout` can't be used on this cover, or null when it can. */
export function layoutUnavailable(layout: CoverLayout, facts: LayoutFacts, opts: { checking?: boolean } = {}): string | null {
  const points = NEEDS_POINTS[layout];
  if (points) {
    if (!facts.shape_read) return opts.checking ? "Checking the post's points…" : "The post's points couldn't be checked yet. Reload to try again.";
    return points.has(facts) ? null : points.missing;
  }
  if (layout === "NUMBER" && !facts.number) return "This draft states no figure a Number cover could use";
  if (layout === "PHOTO" && !facts.photo_ok) return "Needs an opaque headshot (at least 600 px) on the Brand page";
  if (layout === "QUOTE" && !facts.quote_ok) return "No sentence in the post works as a pull quote";
  return null;
}
