"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe2, MessageSquare, Repeat2, Send, ThumbsUp } from "lucide-react";

/** About where LinkedIn's feed cuts a post off with "…see more". */
const FOLD_CHARS = 210;
const FOLD_LINES = 3;

function foldPoint(text: string): number | null {
  let lines = 0;
  for (let i = 0; i < text.length; i++) {
    if (i >= FOLD_CHARS) return i;
    if (text[i] === "\n" && ++lines >= FOLD_LINES) return i;
  }
  return null;
}

export interface LinkedInPostPreviewProps {
  author: { name: string; image?: string | null; headline?: string | null };
  text: string;
  imageUrl?: string | null;
  className?: string;
}

/**
 * The post as a reader meets it in the LinkedIn feed: light card, author
 * line, the fold where "…see more" cuts in, and the cover underneath. It is
 * drawn light on purpose, because that is what most readers see.
 */
export default function LinkedInPostPreview({ author, text, imageUrl, className = "" }: LinkedInPostPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const body = text.trim();
  const fold = foldPoint(body);
  // The feed drops the sentence's own full stop before its "…".
  const shown = expanded || fold === null ? body : body.slice(0, fold).replace(/[\s.]+$/, "");
  const initials = author.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      aria-label="Preview of your LinkedIn post"
      className={`overflow-hidden rounded-2xl border border-[#E0DFDC] bg-white text-left text-[#191919] shadow-[0_12px_40px_-24px_rgba(0,0,0,0.6)] ${className}`}
    >
      <header className="flex items-start gap-2.5 px-4 pt-3">
        {author.image ? (
          <Image src={author.image} alt="" width={48} height={48} unoptimized className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-base font-bold text-white" aria-hidden="true">
            {initials || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{author.name}</p>
          {author.headline && <p className="truncate text-xs text-[#666666]">{author.headline}</p>}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#666666]">
            Now · <Globe2 className="h-3 w-3" aria-label="Public" />
          </p>
        </div>
      </header>

      <div className="px-4 pt-2 pb-2 text-sm leading-[1.45] whitespace-pre-line break-words">
        {shown}
        {fold !== null && !expanded && (
          <>
            {"… "}
            <button type="button" onClick={() => setExpanded(true)} className="font-semibold text-[#666666] hover:text-[#0A66C2] hover:underline cursor-pointer">
              see more
            </button>
          </>
        )}
      </div>

      {imageUrl && (
        <Image src={imageUrl} alt="" width={1200} height={627} unoptimized className="block h-auto w-full border-y border-[#E0DFDC]" />
      )}

      <footer className="grid grid-cols-4 border-t border-[#E0DFDC] px-2 py-1 text-xs font-semibold text-[#666666]" aria-hidden="true">
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageSquare, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: Send, label: "Send" },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center justify-center gap-1.5 rounded-md py-2.5">
            <Icon className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{label}</span>
          </span>
        ))}
      </footer>
    </article>
  );
}
