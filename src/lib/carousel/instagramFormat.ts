/** What Instagram posts for a draft: its carousel's pages, or one poster (the cover). */
export type InstagramFormat = "CAROUSEL" | "SINGLE";

export const INSTAGRAM_FORMATS: readonly InstagramFormat[] = ["CAROUSEL", "SINGLE"];
export const isInstagramFormat = (v: unknown): v is InstagramFormat => v === "CAROUSEL" || v === "SINGLE";

/** Instagram's carousel limit. */
const MAX_PAGES = 10;

/**
 * The carousel pages Instagram can post, cover first: JPEG only (older carousels
 * kept PNGs), 2 to 10 of them. Empty when there is nothing to post as a carousel.
 * Independent of LinkedIn's carousel switch.
 */
export function instagramDeck(spec: unknown): string[] {
  const c = spec as { pages?: unknown } | null;
  if (!c || typeof c !== "object" || !Array.isArray(c.pages)) return [];
  const pages = c.pages.filter((p): p is string => typeof p === "string" && /\.jpe?g(\?|$)/i.test(p)).slice(0, MAX_PAGES);
  return pages.length >= 2 ? pages : [];
}

/** The draft's own pick, else the workspace's last pick, else the carousel; a single poster when there is no carousel. */
export function instagramFormatFor(spec: unknown, workspaceDefault: InstagramFormat | null | undefined): InstagramFormat {
  if (!instagramDeck(spec).length) return "SINGLE";
  const own = (spec as { instagram_format?: unknown }).instagram_format;
  return isInstagramFormat(own) ? own : (workspaceDefault ?? "CAROUSEL");
}

/** The workspace's last pick, kept on its Instagram channel row. */
export function workspaceInstagramFormat(config: unknown): InstagramFormat | null {
  const format = (config as { format?: unknown } | null)?.format;
  return isInstagramFormat(format) ? format : null;
}
