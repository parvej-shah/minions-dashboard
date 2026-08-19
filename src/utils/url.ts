import { blogUrl } from "@/constants/config";
import type { PublishedPlatform } from "@/types";

/**
 * Builds a share-intent URL for a published post.
 * Extracted from the inline ternary chain in the Published page.
 */
export function shareIntentUrl(
  platform: PublishedPlatform,
  post: { title: string; published_url: string },
  copy?: string
): string | null {
  const url = encodeURIComponent(post.published_url);

  switch (platform) {
    case "TWITTER":
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        copy || `${post.title} ${post.published_url}`
      )}`;
    case "LINKEDIN":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    case "FACEBOOK":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case "BLOG":
    default:
      return null;
  }
}

export { blogUrl };
