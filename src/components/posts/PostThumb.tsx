import React from "react";
import type { AssetItem } from "@/types";

/**
 * A post's cover as a 4:5 tile; a soft tile with the title when there is no
 * image yet. The box sets the size, never the image: `min-w-0` lets it shrink
 * inside a flex row, so a 1080px cover can't push out of its card.
 */
export default function PostThumb({ post, className = "" }: { post: Pick<AssetItem, "title" | "hero_image_url">; className?: string }) {
  return (
    <div className={`relative aspect-[4/5] w-full min-w-0 overflow-hidden rounded-[18px] bg-surface-2 ${className}`}>
      {post.hero_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- covers come from storage at many sizes
        <img src={post.hero_image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <p className="absolute inset-x-0 bottom-0 line-clamp-4 p-5 text-[17px] font-bold leading-[1.2] tracking-[-0.02em] text-ink">{post.title}</p>
      )}
    </div>
  );
}
