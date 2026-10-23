import type { Asset, Blog } from "@prisma/client";
import { blogUrl } from "@/constants/config";
import { EMPTY_CHANNEL_URLS, linkedinPostUrl, toChannelUrls, type ChannelUrls } from "@/lib/channels";
import { parsePublishedUrls } from "./asset";
import type { AudienceLane, PublishedPostRecord } from "@/types";

const MARKDOWN_IMAGE = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/;

/** Fallback hero for a published post whose asset carries no image. */
const PUBLISHED_FALLBACK_HERO = "/images/social-covers/github/github_social_dark.png";

/**
 * Prisma blog row (+ its matching asset, if any) -> the published-feed wire shape.
 * Extracted from api/published/route.ts, which mixed this with the query.
 */
export function toPublishedDTO(
  blog: Blog,
  asset: Asset | undefined,
  index: number,
  /** Owning tenant's BrandProfile.companyDomain. See blogUrl(). */
  domain?: string | null
): PublishedPostRecord {
  const inlineImage = (blog.content || "").match(MARKDOWN_IMAGE);
  const postUrl = blogUrl(blog.slug, domain);

  return {
    // Keyed on the slug: it is the blog table's primary key, so it is unique
    // even when two rows point at the same asset. Keying on assetId produced
    // colliding React keys in that case.
    id: `PUB-BLOG-${blog.slug || index + 1}`,
    // Only a resolved asset counts. `blog.assetId` can dangle at a row that no
    // longer exists, and passing that on produces Studio links to nothing.
    asset_id: asset?.id ?? null,
    platform: "BLOG",
    title: blog.title || asset?.title || "Untitled Post",
    excerpt:
      blog.hook || blog.coreArgument || asset?.hook || (blog.content || "").slice(0, 160),
    hero_image_url: inlineImage?.[1] || asset?.heroImageUrl || PUBLISHED_FALLBACK_HERO,
    published_url: postUrl ?? "",
    audience: (blog.audience || asset?.audience || "ICP") as AudienceLane,
    // No asset means no recorded cost. Showing the default here presented a
    // guess as a measurement.
    cost_usd: asset ? Number(asset.generationCost) : null,
    published_at: (
      blog.publishedAt ??
      asset?.publishedAt ??
      new Date()
    ).toISOString(),
    first_comment: postUrl ? `Read the full engineering deep dive: ${postUrl}` : "",
    variants: {
      linkedin: asset?.linkedinVariant ?? "",
      facebook: asset?.facebookVariant ?? "",
      twitter: asset?.xVariant ?? "",
    },
    channel_urls: asset ? channelUrls(asset) : EMPTY_CHANNEL_URLS,
  };
}

/**
 * The publisher records a LinkedIn post as its id in `linkedin_post_id`, never
 * as a URL in `published_urls`, so the LinkedIn link is built from the id when
 * no URL was recorded.
 */
function channelUrls(asset: Asset): ChannelUrls {
  const urls = toChannelUrls(parsePublishedUrls(asset.publishedUrls));
  return { ...urls, linkedin: urls.linkedin ?? linkedinPostUrl(asset.linkedinPostId) };
}
