/**
 * A second LinkedIn post of a published draft (src/services/followUp.ts), in
 * the format the first did not use. Pure rules, shared by the services and the
 * asset mapper.
 */

export type FollowUpFormat = "CAROUSEL" | "COVER";

interface CarouselFile {
  active?: boolean;
  pdf_url?: string;
  caption?: string;
}

/** A stored carousel that has its file, else null. */
export function carouselOf(spec: unknown): (CarouselFile & { pdf_url: string; caption: string }) | null {
  const c = spec as CarouselFile | null;
  return c && typeof c === "object" && c.pdf_url ? { ...c, pdf_url: c.pdf_url, caption: c.caption ?? "" } : null;
}

/** What LinkedIn got with a draft: its carousel or its cover. Null until it went to LinkedIn. */
export function linkedinWentAs(asset: { linkedinPublishedAt: Date | null; carouselSpec: unknown }): FollowUpFormat | null {
  if (!asset.linkedinPublishedAt) return null;
  return carouselOf(asset.carouselSpec)?.active ? "CAROUSEL" : "COVER";
}

/** Why a second post cannot go out yet, or null. A carousel post needs its carousel, switched on. */
export function followUpNotReady(asset: { followUpFormat: string | null; carouselSpec: unknown }): string | null {
  if (asset.followUpFormat !== "CAROUSEL") return null;
  return carouselOf(asset.carouselSpec)?.active ? null : "Make the carousel first: this post is the carousel's.";
}
