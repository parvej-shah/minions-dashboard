"use client";

import React from "react";
import Image from "next/image";
import { Check, Copy, CornerDownRight } from "lucide-react";
import { parseMarkdownBlocks, type MarkdownBlock } from "@/lib/markdown";

export type MarkdownVariant = "compact" | "reading";

export interface MarkdownArticleProps {
  body: string;
  /** `compact` is the split-editor preview; `reading` the immersive lane. */
  variant?: MarkdownVariant;
  onCopyCode?: (code: string, key: string) => void;
  copiedKey?: string | null;
}

/**
 * Renders an editorial body from markdown.
 *
 * One renderer serves both the split preview and the reading lane; they differ
 * only in typography, which is what `variant` selects.
 */
export default function MarkdownArticle({
  body,
  variant = "reading",
  onCopyCode,
  copiedKey,
}: MarkdownArticleProps) {
  const blocks = parseMarkdownBlocks(body);
  const compact = variant === "compact";

  return (
    <>
      {blocks.map((block, idx) => (
        <MarkdownBlockView
          key={idx}
          block={block}
          index={idx}
          compact={compact}
          onCopyCode={onCopyCode}
          copiedKey={copiedKey}
        />
      ))}
    </>
  );
}

function MarkdownBlockView({
  block,
  index,
  compact,
  onCopyCode,
  copiedKey,
}: {
  block: MarkdownBlock;
  index: number;
  compact: boolean;
  onCopyCode?: (code: string, key: string) => void;
  copiedKey?: string | null;
}) {
  const paragraphClass = compact
    ? "break-words [overflow-wrap:anywhere] leading-relaxed text-ink text-xs"
    : "text-[15px] sm:text-[16px] text-ink leading-[1.8] font-normal tracking-normal font-sans selection:bg-brand/20 break-words [overflow-wrap:anywhere]";

  switch (block.kind) {
    case "image": {
      // A cover drawn in code (src/services/cover.ts, stored under covers/) is
      // portrait; a 16:9 frame would cut off its headline and signature.
      const portrait = /\/covers\/[^/]+\/[^/]+\.png$/.test(block.src);
      return (
        <figure className={compact ? "my-3 space-y-1 w-full max-w-full" : "my-6 space-y-2 w-full max-w-full"}>
          <div
            className={`relative overflow-hidden ${
              compact
                ? "rounded-xl border border-line bg-surface"
                : "rounded-2xl border border-line bg-canvas shadow-lg group"
            } ${portrait ? "aspect-[4/5] w-full max-w-[420px] mx-auto" : "aspect-[16/9] w-full max-w-full"}`}
          >
            <Image
              src={block.src}
              alt={block.alt}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 780px"
              className={`object-cover object-center ${
                compact ? "" : "transition-transform duration-500 group-hover:scale-[1.01]"
              }`}
            />
            {!compact && (
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
            )}
          </div>
          {block.alt.trim() && (
            <figcaption
              className={`text-center font-mono text-muted italic truncate ${
                compact ? "text-[10px]" : "text-xs px-2"
              }`}
            >
              {block.alt}
            </figcaption>
          )}
        </figure>
      );
    }

    case "rule":
      return (
        <div
          className={`rounded-2xl border border-brand/30 bg-brand/5 border-l-4 border-l-brand ${
            compact ? "my-3 p-3 rounded-xl" : "my-6 p-5 sm:p-6 shadow-sm"
          }`}
        >
          <span
            className={`rounded-full font-mono font-bold uppercase tracking-wide bg-brand/20 text-brand border border-brand/40 ${
              compact
                ? "px-2 py-0.5 text-[10px] block w-fit mb-1.5"
                : "px-2.5 py-0.5 text-xs inline-block mb-2"
            }`}
          >
            {block.header}
          </span>
          <p
            className={
              compact
                ? "text-xs text-ink break-words [overflow-wrap:anywhere] leading-relaxed font-medium"
                : "text-base sm:text-lg leading-relaxed text-ink font-medium"
            }
          >
            {block.body}
          </p>
        </div>
      );

    case "heading":
      return (
        <div className={compact ? "space-y-1.5 pt-2" : "space-y-3 pt-4"}>
          {block.level === 3 ? (
            compact ? (
              <h4 className="font-bold text-brand text-xs font-sans break-words [overflow-wrap:anywhere]">
                {block.title}
              </h4>
            ) : (
              <h3 className="text-base sm:text-lg font-bold text-brand pt-2 flex items-center gap-2 break-words [overflow-wrap:anywhere] font-sans">
                <CornerDownRight className="w-4 h-4 text-brand shrink-0" />
                <span>{block.title}</span>
              </h3>
            )
          ) : compact ? (
            <h3 className="font-bold text-sm text-brand font-sans break-words [overflow-wrap:anywhere]">
              {block.title}
            </h3>
          ) : (
            <h2 className="text-lg sm:text-2xl font-semibold text-ink pb-2 border-b border-line/60 flex items-center gap-2.5 break-words [overflow-wrap:anywhere] font-sans tracking-tight">
              <span className="text-brand font-mono text-base font-bold shrink-0">#</span>
              <span>{block.title}</span>
            </h2>
          )}
          {block.trailing && <p className={paragraphClass}>{block.trailing}</p>}
        </div>
      );

    case "code":
      return (
        <div className="bg-canvas border border-line rounded-xl overflow-hidden my-4 shadow-inner max-w-full">
          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-2 border-b border-line text-[10px] font-mono text-muted">
            <span className="text-brand font-bold">{block.lang} wire format</span>
            {onCopyCode && (
              <button
                type="button"
                onClick={() => onCopyCode(block.code, `code-${index}`)}
                className="hover:text-ink flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === `code-${index}` ? (
                  <Check className="w-3 h-3 text-brand" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
            )}
          </div>
          <pre className="p-3 sm:p-4 text-xs font-mono text-brand overflow-x-auto leading-relaxed max-w-full">
            {block.code}
          </pre>
        </div>
      );

    case "list":
      return (
        <ul className="space-y-2 my-3 pl-2 max-w-full">
          {block.items.map((item, itemIndex) => (
            <li
              key={itemIndex}
              className={`font-sans leading-relaxed flex items-start gap-2.5 break-words [overflow-wrap:anywhere] ${
                compact ? "text-xs text-ink" : "text-[15px] sm:text-[16px] text-ink/90"
              }`}
            >
              <span className="text-brand font-mono font-bold text-xs mt-1 shrink-0">▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "quote":
      return (
        <blockquote
          className={
            compact
              ? "border-l-2 border-coral pl-2 italic text-muted break-words [overflow-wrap:anywhere] text-xs"
              : "border-l-2 border-coral bg-coral/5 p-3.5 rounded-r-xl text-sm sm:text-[15px] font-sans italic text-ink/90 my-3 break-words [overflow-wrap:anywhere]"
          }
        >
          {block.text}
        </blockquote>
      );

    case "paragraph":
    default:
      return <p className={paragraphClass}>{block.text}</p>;
  }
}
