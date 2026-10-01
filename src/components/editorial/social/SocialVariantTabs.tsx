"use client";

import React, { useRef, useEffect } from "react";
import {
  BarChart2,
  Bookmark,
  Check,
  Copy,
  Edit3,
  Globe,
  MessageCircle,
  MessageSquare,
  Repeat,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import type { AssetItem } from "@/types";

import { Button, buttonStyles } from "@/components/ui/Button";
export type SocialTab = "LINKEDIN" | "FACEBOOK" | "TWITTER";

export interface SocialVariantTabsProps {
  activeAsset: AssetItem;
  socialTab: SocialTab;
  setSocialTab: (tab: SocialTab) => void;
  isEditingSocial: boolean;
  isSaving: boolean;
  setIsEditingSocial: (v: boolean) => void;
  edited: { linkedin: string; facebook: string; twitter: string };
  setEditedLinkedin: (v: string) => void;
  setEditedFacebook: (v: string) => void;
  setEditedTwitter: (v: string) => void;
  onSave: () => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  /** Which of the three tabs to show. */
  enabledTabs?: { LINKEDIN: boolean; FACEBOOK: boolean; TWITTER: boolean };
  /** Blog channel off: there is no article to link, so no first-comment link. */
  blogEnabled?: boolean;
}

export default function SocialVariantTabs({
  activeAsset,
  socialTab,
  setSocialTab,
  isEditingSocial,
  setIsEditingSocial,
  isSaving,
  edited,
  setEditedLinkedin,
  setEditedFacebook,
  setEditedTwitter,
  onSave,
  onCopy,
  copiedKey,
  enabledTabs,
  blogEnabled = true,
}: SocialVariantTabsProps) {
  const author = activeAsset.cover?.author ?? null;
  const showLinkedin = enabledTabs?.LINKEDIN ?? true;
  const showFacebook = enabledTabs?.FACEBOOK ?? true;
  const showTwitter = enabledTabs?.TWITTER ?? true;

  const liTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fbTextareaRef = useRef<HTMLTextAreaElement>(null);
  const twTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textareas based on content
  useEffect(() => {
    if (isEditingSocial) {
      if (socialTab === "LINKEDIN" && liTextareaRef.current) {
        liTextareaRef.current.style.height = "auto";
        liTextareaRef.current.style.height = `${Math.max(160, liTextareaRef.current.scrollHeight)}px`;
      } else if (socialTab === "FACEBOOK" && fbTextareaRef.current) {
        fbTextareaRef.current.style.height = "auto";
        fbTextareaRef.current.style.height = `${Math.max(160, fbTextareaRef.current.scrollHeight)}px`;
      } else if (socialTab === "TWITTER" && twTextareaRef.current) {
        twTextareaRef.current.style.height = "auto";
        twTextareaRef.current.style.height = `${Math.max(140, twTextareaRef.current.scrollHeight)}px`;
      }
    }
  }, [isEditingSocial, socialTab, edited]);

  const getStats = (text: string) => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { chars, words };
  };

  return (
    <section aria-labelledby="channel-preview-title" className="overflow-hidden rounded-3xl border-2 border-b-4 border-line bg-surface shadow-xl">
      <div className="flex flex-col gap-4 border-b-2 border-line bg-gradient-to-br from-brand/10 via-surface to-surface p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10 text-brand">
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="channel-preview-title" className="text-xl font-extrabold text-ink">Channel preview</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">Choose a channel to preview and edit its copy. <a href="#cover-image" className="font-semibold text-brand underline underline-offset-2 hover:text-ink focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Choose the thumbnail style below ↓</a></p>
          </div>
        </div>

        {/* Social Platform Tabs */}
        <div role="tablist" aria-label="Publishing channel" className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-line bg-canvas p-1.5 sm:flex sm:w-auto sm:flex-wrap">
          {showLinkedin && (
            <button
              type="button"
              role="tab"
              aria-selected={socialTab === "LINKEDIN"}
              onClick={() => setSocialTab("LINKEDIN")}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 ${
                socialTab === "LINKEDIN"
                  ? "bg-[#0077B5] border-[#005A88] text-white shadow-md shadow-[#0077B5]/20"
                  : "text-muted border-line hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>LinkedIn</span>
            </button>
          )}

          {showFacebook && (
            <button
              type="button"
              role="tab"
              aria-selected={socialTab === "FACEBOOK"}
              onClick={() => setSocialTab("FACEBOOK")}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 ${
                socialTab === "FACEBOOK"
                  ? "bg-[#1877F2] border-[#0F58B8] text-white shadow-md shadow-[#1877F2]/20"
                  : "text-muted border-line hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>Facebook</span>
            </button>
          )}

          {showTwitter && (
            <button
              type="button"
              role="tab"
              aria-selected={socialTab === "TWITTER"}
              onClick={() => setSocialTab("TWITTER")}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 ${
                socialTab === "TWITTER"
                  ? "bg-[#1DA1F2] border-[#1378B5] text-white shadow-md shadow-[#1DA1F2]/20"
                  : "text-muted border-line hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>X</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-5">
      {/* ======================================================== */}
      {/* TAB A: LINKEDIN REALISTIC FEED MOCK & EDITOR */}
      {/* ======================================================== */}
      {showLinkedin && socialTab === "LINKEDIN" && (
        <div className="space-y-4 rounded-2xl border border-line bg-canvas p-4 font-sans sm:p-5 sm:shadow-lg">
          {/* Author Header */}
          <div className="flex flex-col gap-3 border-b border-line/50 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#0077B5]/20 border border-[#0077B5]/40 flex items-center justify-center font-bold text-xs text-[#0077B5] shrink-0">
                in
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-ink truncate">
                    {author?.name ?? "Editorial Author"}
                  </span>
                  <span className="text-brand text-xs shrink-0 font-bold">✓</span>
                  <span className="text-[10px] text-subtle shrink-0">• 1st</span>
                </div>
                <div className="text-[11px] text-muted truncate">
                  {author ? author.role ?? "" : "Engineering & Enterprise Thought Leadership"}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingSocial(!isEditingSocial)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 sm:flex-none ${
                  isEditingSocial
                    ? "bg-brand/15 text-brand border-brand/40 shadow-xs"
                    : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink border-line"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="sm:hidden">{isEditingSocial ? "Preview" : "Edit"}</span>
                <span className="hidden sm:inline">{isEditingSocial ? "Preview" : "Edit post"}</span>
              </button>

              <button
                type="button"
                onClick={() => onCopy(edited.linkedin || "", "social-linkedin")}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl sm:flex-none bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#0077B5] border border-[#0077B5]/40 text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedKey === "social-linkedin" ? (
                  <Check className="w-3.5 h-3.5 text-brand" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === "social-linkedin" ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* LinkedIn Body Editor / Viewer */}
          {isEditingSocial ? (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  ref={liTextareaRef}
                  value={edited.linkedin}
                  onChange={(e) => {
                    setEditedLinkedin(e.target.value);
                    if (liTextareaRef.current) {
                      liTextareaRef.current.style.height = "auto";
                      liTextareaRef.current.style.height = `${liTextareaRef.current.scrollHeight}px`;
                    }
                  }}
                  placeholder="Draft or polish your LinkedIn post copy here..."
                  className="w-full resize-none rounded-2xl border-2 border-brand/50 bg-canvas p-4 text-[15px] leading-7 text-ink shadow-inner outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>

              {/* Polished Edit Footer */}
              <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border-2 border-line bg-surface/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] font-mono text-muted flex items-center gap-2">
                  <span>{getStats(edited.linkedin).chars.toLocaleString()} characters</span>
                  <span>•</span>
                  <span>{getStats(edited.linkedin).words.toLocaleString()} words</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSocial(false)}
                    className={buttonStyles({ variant: "ghost", size: "md" })}
                  >
                    Preview
                  </button>
                  <Button type="button" onClick={onSave} loading={isSaving} size="md" icon={<Check className="h-4 w-4" />}>
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-line break-words rounded-none border-0 bg-transparent p-0 font-sans text-[14px] leading-[1.65] text-ink select-text sm:rounded-xl sm:border sm:border-line/60 sm:bg-[#0B0F14] sm:p-4.5 sm:text-xs sm:leading-relaxed">
              {edited.linkedin || (
                <span className="text-subtle italic">
                  No LinkedIn variant was generated for this draft yet.
                </span>
              )}
            </div>
          )}

          {/* The cover 03 attaches to the post, shown the way the feed crops it. */}
          {activeAsset.hero_image_url && activeAsset.hero_status === "READY" && (
            <div
              className={`relative w-full overflow-hidden rounded-xl border border-line bg-[#0B0F14] ${
                activeAsset.hero_provider === "template" ? "aspect-[4/5] max-w-[420px] mx-auto" : "aspect-[16/9]"
              }`}
            >
              <Image src={activeAsset.hero_image_url} alt={activeAsset.title} fill unoptimized sizes="420px" className="object-cover" />
            </div>
          )}

          {/* First Comment Link Anchor */}
          {blogEnabled && activeAsset.doc_url && (
            <div className="bg-brand/5 border border-brand/20 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-brand uppercase flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  First Comment (Link Anchor)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(`Read the full deep dive: ${activeAsset.doc_url}`, "first-comment-li")
                  }
                  className="text-[10px] font-mono text-brand hover:underline cursor-pointer"
                >
                  {copiedKey === "first-comment-li" ? "Copied!" : "Copy Anchor"}
                </button>
              </div>
              <p className="text-xs font-mono text-muted break-all">
                {`Read the full deep dive: ${activeAsset.doc_url}`}
              </p>
            </div>
          )}
          {blogEnabled && !activeAsset.doc_url && (
            <p className="text-[11px] text-subtle leading-relaxed">
              No blog link: this workspace has no website of its own yet. Add your domain under Brand &amp; Directives to link each post to its full article.
            </p>
          )}

          {/* LinkedIn Action Bar (Realistic Mock) */}
          <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-muted" aria-hidden="true">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Like</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Comment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              <span>Repost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB B: FACEBOOK REALISTIC POST MOCK & EDITOR */}
      {/* ======================================================== */}
      {showFacebook && socialTab === "FACEBOOK" && (
        <div className="bg-canvas rounded-2xl border border-line p-5 space-y-4 font-sans shadow-lg">
          {/* Facebook Author Header */}
          <div className="flex flex-col gap-3 border-b border-line/50 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 border border-[#1877F2]/40 flex items-center justify-center font-bold text-xs text-[#1877F2] shrink-0">
                f
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-ink">
                    Editorial Author
                  </span>
                  <span className="text-[#1877F2] text-xs font-bold">●</span>
                </div>
                <div className="text-[10px] text-subtle flex items-center gap-1">
                  <span>Just now</span>
                  <span>•</span>
                  <Globe className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingSocial(!isEditingSocial)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 sm:flex-none ${
                  isEditingSocial
                    ? "bg-brand/15 text-brand border-brand/40 shadow-xs"
                    : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink border-line"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="sm:hidden">{isEditingSocial ? "Preview" : "Edit"}</span>
                <span className="hidden sm:inline">{isEditingSocial ? "Preview" : "Edit post"}</span>
              </button>

              <button
                type="button"
                onClick={() => onCopy(edited.facebook || "", "social-facebook")}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg sm:flex-none bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border border-[#1877F2]/40 text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedKey === "social-facebook" ? (
                  <Check className="w-3.5 h-3.5 text-brand" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === "social-facebook" ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Facebook Body Copy / Textarea */}
          {isEditingSocial ? (
            <div className="space-y-3">
              <textarea
                ref={fbTextareaRef}
                value={edited.facebook}
                onChange={(e) => {
                  setEditedFacebook(e.target.value);
                  if (fbTextareaRef.current) {
                    fbTextareaRef.current.style.height = "auto";
                    fbTextareaRef.current.style.height = `${fbTextareaRef.current.scrollHeight}px`;
                  }
                }}
                placeholder="Draft or polish your Facebook post copy here..."
                className="w-full resize-none rounded-2xl border-2 border-brand/50 bg-canvas p-4 text-[15px] leading-7 text-ink shadow-inner outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
              />

              <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border-2 border-line bg-surface/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] font-mono text-muted flex items-center gap-2">
                  <span>{getStats(edited.facebook).chars.toLocaleString()} characters</span>
                  <span>•</span>
                  <span>{getStats(edited.facebook).words.toLocaleString()} words</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSocial(false)}
                    className={buttonStyles({ variant: "ghost", size: "md" })}
                  >
                    Preview
                  </button>
                  <Button type="button" onClick={onSave} loading={isSaving} size="md" icon={<Check className="h-4 w-4" />}>
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink leading-relaxed whitespace-pre-line bg-[#0B0F14] p-4.5 rounded-xl border border-line/60 font-sans select-text">
              {edited.facebook || (
                <span className="text-subtle italic">
                  No Facebook variant was generated for this draft yet.
                </span>
              )}
            </div>
          )}

          {/* First Comment Box */}
          {activeAsset.doc_url && (
            <div className="bg-[#1877F2]/5 border border-[#1877F2]/20 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#1877F2] uppercase block">
                First Comment (Pinned Link)
              </span>
              <p className="text-xs font-mono text-muted break-all">
                {`Full deep dive on our blog: ${activeAsset.doc_url}`}
              </p>
            </div>
          )}

          {/* Facebook Action Bar */}
          <div className="flex items-center justify-around pt-3 border-t border-line/60 text-xs text-muted" aria-hidden="true">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Like</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Comment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB C: TWITTER / X REALISTIC THREAD MOCK & EDITOR */}
      {/* ======================================================== */}
      {showTwitter && socialTab === "TWITTER" && (
        <div className="bg-canvas rounded-2xl border border-line p-5 space-y-4 font-sans shadow-lg">
          {/* Twitter Author Header */}
          <div className="flex flex-col gap-3 border-b border-line/50 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-white shrink-0">
                𝕏
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-ink">
                    Editorial Author
                  </span>
                  <span className="text-[11px] text-subtle">@author</span>
                </div>
                <div className="text-[10px] text-subtle">Enterprise Architecture & AI</div>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingSocial(!isEditingSocial)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 sm:flex-none ${
                  isEditingSocial
                    ? "bg-brand/15 text-brand border-brand/40 shadow-xs"
                    : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink border-line"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="sm:hidden">{isEditingSocial ? "Preview" : "Edit"}</span>
                <span className="hidden sm:inline">{isEditingSocial ? "Preview" : "Edit post"}</span>
              </button>

              <button
                type="button"
                onClick={() => onCopy(edited.twitter || "", "social-twitter")}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg sm:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedKey === "social-twitter" ? (
                  <Check className="w-3.5 h-3.5 text-brand" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === "social-twitter" ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Twitter Body Copy / Textarea */}
          {isEditingSocial ? (
            <div className="space-y-3">
              <textarea
                ref={twTextareaRef}
                value={edited.twitter}
                onChange={(e) => {
                  setEditedTwitter(e.target.value);
                  if (twTextareaRef.current) {
                    twTextareaRef.current.style.height = "auto";
                    twTextareaRef.current.style.height = `${twTextareaRef.current.scrollHeight}px`;
                  }
                }}
                placeholder="Draft or polish your X / Twitter thread or post..."
                className="w-full resize-none rounded-2xl border-2 border-brand/50 bg-canvas p-4 text-[15px] leading-7 text-ink shadow-inner outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
              />

              <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border-2 border-line bg-surface/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className={`${edited.twitter.length > 280 ? "text-red-400 font-bold" : "text-muted"}`}>
                    {edited.twitter.length}/280 characters
                  </span>
                  <span>•</span>
                  <span className="text-muted">{getStats(edited.twitter).words} words</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSocial(false)}
                    className={buttonStyles({ variant: "ghost", size: "md" })}
                  >
                    Preview
                  </button>
                  <Button type="button" onClick={onSave} loading={isSaving} size="md" icon={<Check className="h-4 w-4" />}>
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink leading-relaxed whitespace-pre-line bg-[#0B0F14] p-4.5 rounded-xl border border-line/60 font-sans select-text">
              {edited.twitter || (
                <span className="text-subtle italic">
                  No X variant was generated for this draft yet.
                </span>
              )}
            </div>
          )}

          {/* Twitter Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-subtle" aria-hidden="true">
            <MessageCircle className="w-3.5 h-3.5" />
            <Repeat className="w-3.5 h-3.5" />
            <ThumbsUp className="w-3.5 h-3.5" />
            <BarChart2 className="w-3.5 h-3.5" />
            <Bookmark className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
