"use client";

import React from "react";
import {
  BarChart2,
  Bookmark,
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
import { SOCIAL_CHANNELS, channelFor, type SocialChannel, type SocialTab, type VariantField } from "./channels";
import VariantActions from "./VariantActions";
import VariantEditor from "./VariantEditor";

export type { SocialTab };

export interface SocialVariantTabsProps {
  activeAsset: AssetItem;
  socialTab: SocialTab;
  setSocialTab: (tab: SocialTab) => void;
  isEditingSocial: boolean;
  isSaving: boolean;
  setIsEditingSocial: (v: boolean) => void;
  edited: Record<VariantField, string>;
  setEditedLinkedin: (v: string) => void;
  setEditedFacebook: (v: string) => void;
  setEditedTwitter: (v: string) => void;
  onSave: () => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  /** Which of the three tabs to show. */
  enabledTabs?: Record<SocialTab, boolean>;
  /** Blog channel off: there is no article to link, so no first-comment link. */
  blogEnabled?: boolean;
}

interface PanelProps {
  channel: SocialChannel;
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  /** Who the post is "from", drawn left of the actions. */
  identity: React.ReactNode;
  panelClass: string;
  previewClass: string;
  /** Content between the post body and the mock action bar. */
  extras?: React.ReactNode;
  /** The decorative like/comment/share bar. */
  actionBar: React.ReactNode;
}

/** One channel's mock post: author line, edit and copy actions, the text, and the channel's trimmings. */
function ChannelPanel({ channel, value, onChange, isEditing, isSaving, onToggleEdit, onSave, onCopy, copiedKey, identity, panelClass, previewClass, extras, actionBar }: PanelProps) {
  const copyKey = `social-${channel.field}`;
  return (
    <div className={panelClass}>
      <div className="flex flex-col gap-3 border-b border-line/50 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        {identity}
        <VariantActions
          isEditing={isEditing}
          onToggleEdit={onToggleEdit}
          onCopy={() => onCopy(value || "", copyKey)}
          isCopied={copiedKey === copyKey}
          copyClass={channel.copyClass}
        />
      </div>

      {isEditing ? (
        <VariantEditor
          value={value}
          onChange={onChange}
          placeholder={channel.placeholder}
          minHeight={channel.textareaMinHeight}
          charLimit={channel.charLimit}
          isSaving={isSaving}
          onSave={onSave}
          onPreview={onToggleEdit}
        />
      ) : (
        <div className={previewClass}>{value || <span className="text-subtle italic">{channel.emptyMessage}</span>}</div>
      )}

      {extras}
      {actionBar}
    </div>
  );
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
  const visibleChannels = SOCIAL_CHANNELS.filter((channel) => enabledTabs?.[channel.tab] ?? true);
  const setters: Record<VariantField, (v: string) => void> = {
    linkedin: setEditedLinkedin,
    facebook: setEditedFacebook,
    twitter: setEditedTwitter,
  };
  const panel = {
    isEditing: isEditingSocial,
    isSaving,
    onToggleEdit: () => setIsEditingSocial(!isEditingSocial),
    onSave,
    onCopy,
    copiedKey,
  };
  const forChannel = (tab: SocialTab) => {
    const channel = channelFor(tab);
    return { ...panel, channel, value: edited[channel.field], onChange: setters[channel.field] };
  };
  const isShown = (tab: SocialTab) => socialTab === tab && visibleChannels.some((channel) => channel.tab === tab);

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

        <div role="tablist" aria-label="Publishing channel" className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-line bg-canvas p-1.5 sm:flex sm:w-auto sm:flex-wrap">
          {visibleChannels.map((channel) => (
            <button
              key={channel.tab}
              type="button"
              role="tab"
              aria-selected={socialTab === channel.tab}
              onClick={() => setSocialTab(channel.tab)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-b-4 px-4 py-2 text-sm font-extrabold transition-all cursor-pointer active:translate-y-1 active:border-b-0 ${
                socialTab === channel.tab ? channel.tabActiveClass : "text-muted border-line hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>{channel.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {isShown("LINKEDIN") && (
          <ChannelPanel
            {...forChannel("LINKEDIN")}
            panelClass="space-y-4 rounded-2xl border border-line bg-canvas p-4 font-sans sm:p-5 sm:shadow-lg"
            previewClass="whitespace-pre-line break-words rounded-none border-0 bg-transparent p-0 font-sans text-[14px] leading-[1.65] text-ink select-text sm:rounded-xl sm:border sm:border-line/60 sm:bg-[#0B0F14] sm:p-4.5 sm:text-xs sm:leading-relaxed"
            identity={
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#0077B5]/20 border border-[#0077B5]/40 flex items-center justify-center font-bold text-xs text-[#0077B5] shrink-0">
                  in
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-ink truncate">{author?.name ?? "Editorial Author"}</span>
                    <span className="text-brand text-xs shrink-0 font-bold">✓</span>
                    <span className="text-[10px] text-subtle shrink-0">• 1st</span>
                  </div>
                  <div className="text-[11px] text-muted truncate">
                    {author ? author.role ?? "" : "Engineering & Enterprise Thought Leadership"}
                  </div>
                </div>
              </div>
            }
            extras={
              <>
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
              </>
            }
            actionBar={
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
            }
          />
        )}

        {isShown("FACEBOOK") && (
          <ChannelPanel
            {...forChannel("FACEBOOK")}
            panelClass="bg-canvas rounded-2xl border border-line p-5 space-y-4 font-sans shadow-lg"
            previewClass="text-xs text-ink leading-relaxed whitespace-pre-line bg-[#0B0F14] p-4.5 rounded-xl border border-line/60 font-sans select-text"
            identity={
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 border border-[#1877F2]/40 flex items-center justify-center font-bold text-xs text-[#1877F2] shrink-0">
                  f
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-ink">Editorial Author</span>
                    <span className="text-[#1877F2] text-xs font-bold">●</span>
                  </div>
                  <div className="text-[10px] text-subtle flex items-center gap-1">
                    <span>Just now</span>
                    <span>•</span>
                    <Globe className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            }
            extras={
              <>
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
              </>
            }
            actionBar={
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
            }
          />
        )}

        {isShown("TWITTER") && (
          <ChannelPanel
            {...forChannel("TWITTER")}
            panelClass="bg-canvas rounded-2xl border border-line p-5 space-y-4 font-sans shadow-lg"
            previewClass="text-xs text-ink leading-relaxed whitespace-pre-line bg-[#0B0F14] p-4.5 rounded-xl border border-line/60 font-sans select-text"
            identity={
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  𝕏
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-ink">Editorial Author</span>
                    <span className="text-[11px] text-subtle">@author</span>
                  </div>
                  <div className="text-[10px] text-subtle">Enterprise Architecture & AI</div>
                </div>
              </div>
            }
            actionBar={
              <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-subtle" aria-hidden="true">
                <MessageCircle className="w-3.5 h-3.5" />
                <Repeat className="w-3.5 h-3.5" />
                <ThumbsUp className="w-3.5 h-3.5" />
                <BarChart2 className="w-3.5 h-3.5" />
                <Bookmark className="w-3.5 h-3.5" />
              </div>
            }
          />
        )}
      </div>
    </section>
  );
}
