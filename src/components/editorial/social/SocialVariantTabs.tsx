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
  X,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import type { AssetItem } from "@/types";

import { buttonStyles } from "@/components/ui/Button";
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
    <div className="space-y-4 bg-transparent p-0 shadow-none sm:space-y-5 sm:rounded-2xl sm:border sm:border-line sm:bg-surface sm:p-5 sm:shadow-xl">
      {/* Header & Platform Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold text-ink font-mono uppercase tracking-wider">
            Social Media Staging & Previews
          </span>
        </div>

        {/* Social Platform Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 bg-canvas p-1 rounded-xl border border-line">
          {showLinkedin && (
            <button
              onClick={() => setSocialTab("LINKEDIN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                socialTab === "LINKEDIN"
                  ? "bg-[#0077B5] text-white shadow-md shadow-[#0077B5]/20 font-bold"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>LinkedIn Feed</span>
            </button>
          )}

          {showFacebook && (
            <button
              onClick={() => setSocialTab("FACEBOOK")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                socialTab === "FACEBOOK"
                  ? "bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/20 font-bold"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>Facebook Post</span>
            </button>
          )}

          {showTwitter && (
            <button
              onClick={() => setSocialTab("TWITTER")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                socialTab === "TWITTER"
                  ? "bg-[#1DA1F2] text-white shadow-md shadow-[#1DA1F2]/20 font-bold"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>X / Twitter</span>
            </button>
          )}
        </div>
      </div>

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
                className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer sm:flex-none ${
                  isEditingSocial
                    ? "bg-brand/15 text-brand border-brand/40 shadow-xs"
                    : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink border-line"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="sm:hidden">{isEditingSocial ? "Preview" : "Edit"}</span>
                <span className="hidden sm:inline">{isEditingSocial ? "Previewing" : "Edit Copy"}</span>
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
                  className="w-full bg-[#0B0F14] border border-brand/40 focus:border-brand rounded-xl p-4 text-xs text-ink leading-relaxed resize-none outline-none font-sans shadow-inner transition-all"
                />
              </div>

              {/* Polished Edit Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F14] p-3 rounded-xl border border-line">
                <div className="text-[11px] font-mono text-muted flex items-center gap-2">
                  <span>{getStats(edited.linkedin).chars.toLocaleString()} characters</span>
                  <span>•</span>
                  <span>{getStats(edited.linkedin).words.toLocaleString()} words</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSocial(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-surface-2 transition-all cursor-pointer"
                  >
                    Done Editing
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className={buttonStyles({ size: "sm" })}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
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
          <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-muted">
            <div className="flex items-center gap-1.5 hover:text-ink cursor-pointer">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Like</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-ink cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Comment</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-ink cursor-pointer">
              <Repeat className="w-3.5 h-3.5" />
              <span>Repost</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-ink cursor-pointer">
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
                className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer sm:flex-none ${
                  isEditingSocial
                    ? "bg-brand/15 text-brand border-brand/40 shadow-xs"
                    : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink border-line"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="sm:hidden">{isEditingSocial ? "Preview" : "Edit"}</span>
                <span className="hidden sm:inline">{isEditingSocial ? "Previewing" : "Edit Copy"}</span>
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
                className="w-full bg-[#0B0F14] border border-brand/40 focus:border-brand rounded-xl p-4 text-xs text-ink leading-relaxed resize-none outline-none font-sans shadow-inner transition-all"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F14] p-3 rounded-xl border border-line">
                <div className="text-[11px] font-mono text-muted flex items-center gap-2">
                  <span>{getStats(edited.facebook).chars.toLocaleString()} characters</span>
                  <span>•</span>
                  <span>{getStats(edited.facebook).words.toLocaleString()} words</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSocial(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-surface-2 transition-all cursor-pointer"
                  >
                    Done Editing
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className={buttonStyles({ size: "sm" })}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
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
          <div className="flex items-center justify-around pt-3 border-t border-line/60 text-xs text-muted">
            <div className="flex items-center gap-1.5 hover:text-ink cursor-pointer">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Like</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-ink cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Comment</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-ink cursor-pointer">
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
                className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer sm:flex-none ${
                  isEditingSocial
                    ? "bg-brand/15 text-brand border-brand/40 shadow-xs"
                    : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink border-line"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="sm:hidden">{isEditingSocial ? "Preview" : "Edit"}</span>
                <span className="hidden sm:inline">{isEditingSocial ? "Previewing" : "Edit Copy"}</span>
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
                className="w-full bg-[#0B0F14] border border-brand/40 focus:border-brand rounded-xl p-4 text-xs text-ink leading-relaxed resize-none outline-none font-sans shadow-inner transition-all"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F14] p-3 rounded-xl border border-line">
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-surface-2 transition-all cursor-pointer"
                  >
                    Done Editing
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className={buttonStyles({ size: "sm" })}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
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
          <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-subtle">
            <MessageCircle className="w-3.5 h-3.5 hover:text-[#1DA1F2] cursor-pointer" />
            <Repeat className="w-3.5 h-3.5 hover:text-brand cursor-pointer" />
            <ThumbsUp className="w-3.5 h-3.5 hover:text-red-400 cursor-pointer" />
            <BarChart2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
            <Bookmark className="w-3.5 h-3.5 hover:text-brand cursor-pointer" />
          </div>
        </div>
      )}
    </div>
  );
}
