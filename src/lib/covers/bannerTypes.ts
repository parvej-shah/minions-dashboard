/**
 * The modern banner cover types (covers/modern.tsx) and the social poster
 * types (covers/social.tsx, tasks/33.md). Their own module so layouts.tsx,
 * modern.tsx and social.tsx can all import the lists without a cycle.
 */
export const SOCIAL_DESIGNS = ["HIGHLIGHT", "SWISS", "SIDEWAYS", "ECHO", "BOLD", "SPLIT", "MAGAZINE", "BENTO", "TAGGED", "NEON"] as const;
export type SocialDesign = (typeof SOCIAL_DESIGNS)[number];

export const BANNER_DESIGNS = ["TORN", "SELECT", "STICKER", "NOTEBOOK", "NOTES", "POSTCARD", "CIRCLED", "CUTOUT", ...SOCIAL_DESIGNS] as const;
export type BannerDesign = (typeof BANNER_DESIGNS)[number];

export const isBanner = (layout: string): layout is BannerDesign => (BANNER_DESIGNS as readonly string[]).includes(layout);
export const isSocial = (layout: string): layout is SocialDesign => (SOCIAL_DESIGNS as readonly string[]).includes(layout);
