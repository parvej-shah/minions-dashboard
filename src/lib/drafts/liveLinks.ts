import type { AssetItem } from "@/types";

export interface LiveLink {
  label: "LinkedIn" | "your blog";
  url: string;
}

/**
 * Where a published draft can be read, LinkedIn first. The blog counts only
 * while the blog channel is on: `doc_url` falls back to a blog address even
 * for workspaces that never post there.
 */
export function liveLinks(asset: Pick<AssetItem, "linkedin_url" | "doc_url" | "live_blog_url">, blogEnabled: boolean): LiveLink[] {
  const links: LiveLink[] = [];
  if (asset.linkedin_url) links.push({ label: "LinkedIn", url: asset.linkedin_url });
  const blog = blogEnabled ? asset.live_blog_url || asset.doc_url : null;
  if (blog) links.push({ label: "your blog", url: blog });
  return links;
}
