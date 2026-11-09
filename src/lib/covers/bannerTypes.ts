/**
 * The modern banner cover types (covers/modern.tsx). Their own module so
 * layouts.tsx and modern.tsx can both import the list without a cycle.
 */
export const BANNER_DESIGNS = ["TORN", "SELECT", "STICKER", "NOTEBOOK", "NOTES", "POSTCARD", "CIRCLED", "CUTOUT"] as const;
export type BannerDesign = (typeof BANNER_DESIGNS)[number];

export const isBanner = (layout: string): layout is BannerDesign => (BANNER_DESIGNS as readonly string[]).includes(layout);
