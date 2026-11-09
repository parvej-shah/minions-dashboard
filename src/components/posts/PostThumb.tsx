import React from "react";
import type { AssetItem } from "@/types";

/** A post's cover as a calm card; a soft tile with the title when there is no image yet. */
export default function PostThumb({ post, className = "" }: { post: Pick<AssetItem, "title" | "hero_image_url">; className?: string }) {
  if (post.hero_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- covers come from storage at many sizes
      <img src={post.hero_image_url} alt="" loading="lazy" className={`aspect-[4/5] w-full rounded-2xl bg-surface-2 object-cover ${className}`} />
    );
  }
  return (
    <div className={`flex aspect-[4/5] w-full items-end rounded-2xl bg-surface-2 p-4 ${className}`}>
      <p className="line-clamp-4 text-[15px] font-semibold leading-snug tracking-tight text-ink">{post.title}</p>
    </div>
  );
}
