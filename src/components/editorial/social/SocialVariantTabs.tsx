"use client";

import React from "react";
import { Download, Loader2, MessageSquare } from "lucide-react";
import Image from "next/image";
import type { AssetItem } from "@/types";
import type { InstagramFormat } from "@/lib/carousel/instagramFormat";
import { SOCIAL_CHANNELS, channelFor, type SocialChannel, type SocialTab, type VariantField } from "./channels";
import VariantActions from "./VariantActions";
import VariantEditor from "./VariantEditor";
import { linkComment } from "@/lib/socialCopy";

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
  setEditedInstagram: (v: string) => void;
  onSave: () => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  /** Which tabs to show. */
  enabledTabs?: Record<SocialTab, boolean>;
  /** Blog channel off: there is no article to link, so no first-comment link. */
  blogEnabled?: boolean;
  /** What Instagram gets for this draft: its pick, else the workspace's last pick, else the carousel. */
  instagramFormat?: InstagramFormat;
  /** Given, the Instagram tab can hand every carousel page to the person to post by hand. */
  onSavePages?: () => void;
  savingPages?: boolean;
  /** LinkedIn is posting the carousel: its post text and pages, shown in place of the LinkedIn text and cover. */
  linkedinCarousel?: { caption: string; pages: string[] } | null;
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
  /** Content between the post body and footer actions. */
  extras?: React.ReactNode;
  /** False when the text is edited elsewhere. */
  canEdit?: boolean;
}

/** One channel's clean post card: author line, edit and copy actions, and the text. */
function ChannelPanel({
  channel,
  value,
  onChange,
  isEditing,
  isSaving,
  onToggleEdit,
  onSave,
  onCopy,
  copiedKey,
  identity,
  extras,
  canEdit,
}: PanelProps) {
  const copyKey = `social-${channel.field}`;
  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
        {identity}
        <VariantActions
          isEditing={isEditing}
          onToggleEdit={onToggleEdit}
          onCopy={() => onCopy(value || "", copyKey)}
          isCopied={copiedKey === copyKey}
          copyClass={channel.copyClass}
          canEdit={canEdit}
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
        <div className="rounded-2xl bg-surface-2 p-5 text-[15px] leading-[1.65] text-ink whitespace-pre-line break-words select-text">
          {value || <span className="text-subtle italic">{channel.emptyMessage}</span>}
        </div>
      )}

      {extras}
    </div>
  );
}

interface ChannelMediaPreviewProps {
  channelLabel: string;
  isCarousel: boolean;
  pages: string[] | null;
  heroImageUrl: string | null;
  title: string;
  onSavePages?: () => void;
  savingPages?: boolean;
}

/** Unified media preview for a channel card: swipeable carousel slides or single cover poster. */
function ChannelMediaPreview({
  channelLabel,
  isCarousel,
  pages,
  heroImageUrl,
  title,
  onSavePages,
  savingPages = false,
}: ChannelMediaPreviewProps) {
  if (isCarousel && pages && pages.length > 0) {
    return (
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{channelLabel} posts the {pages.length}-slide carousel configured above</span>
          <span className="font-medium text-ink">{pages.length} slides</span>
        </div>
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-none">
          {pages.map((page, i) => (
            <a
              key={page}
              href={page}
              target="_blank"
              rel="noopener noreferrer"
              className="snap-start shrink-0 w-[70%] sm:w-[220px]"
              title={`View slide ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page}
                alt={`Page ${i + 1} of ${pages.length}`}
                className="aspect-[4/5] w-full rounded-lg border border-line object-cover"
              />
            </a>
          ))}
        </div>
        {onSavePages && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onSavePages}
              disabled={savingPages}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 text-sm font-semibold text-ink cursor-pointer hover:bg-surface-3 disabled:opacity-50"
            >
              {savingPages ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              {`Save all ${pages.length} pages`}
            </button>
            <p className="text-[13px] leading-snug text-muted">
              Then in {channelLabel}: New post, select the pages in order, paste the caption (Copy above).
            </p>
          </div>
        )}
      </div>
    );
  }

  if (heroImageUrl) {
    return (
      <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-xl border border-line bg-surface-2">
        <Image src={heroImageUrl} alt={title} fill unoptimized sizes="420px" className="object-cover" />
      </div>
    );
  }

  return null;
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
  setEditedInstagram,
  onSave,
  onCopy,
  copiedKey,
  enabledTabs,
  blogEnabled = true,
  instagramFormat,
  onSavePages,
  savingPages = false,
  linkedinCarousel = null,
}: SocialVariantTabsProps) {
  const author = activeAsset.cover?.author ?? null;
  const effectiveFormat = instagramFormat ?? activeAsset.instagram_format ?? "CAROUSEL";
  const isCarouselActive = Boolean(linkedinCarousel) || (Boolean(activeAsset.carousel_pages?.length) && effectiveFormat === "CAROUSEL");
  const pages = activeAsset.carousel_pages?.length ? activeAsset.carousel_pages : (linkedinCarousel?.pages?.length ? linkedinCarousel.pages : null);
  const carouselDeck = isCarouselActive && pages?.length ? pages : null;
  const heroImage = activeAsset.hero_image_url && activeAsset.hero_status === "READY" ? activeAsset.hero_image_url : null;
  const visibleChannels = SOCIAL_CHANNELS.filter((channel) => enabledTabs?.[channel.tab] ?? true);
  const setters: Record<VariantField, (v: string) => void> = {
    linkedin: setEditedLinkedin,
    facebook: setEditedFacebook,
    twitter: setEditedTwitter,
    instagram: setEditedInstagram,
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
    <section aria-labelledby="channel-preview-title" className="rounded-[28px] bg-surface shadow-soft p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-4 pb-2 border-b border-line/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="channel-preview-title" className="text-[17px] font-semibold text-ink">Captions</h2>
          <p className="text-[13px] text-muted">Post text for each connected channel.</p>
        </div>

        <div role="tablist" aria-label="Publishing channel" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-3 p-1 sm:flex sm:w-auto sm:gap-1.5 sm:rounded-full">
          {visibleChannels.map((channel) => (
            <button
              key={channel.tab}
              type="button"
              role="tab"
              aria-selected={socialTab === channel.tab}
              onClick={() => setSocialTab(channel.tab)}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer sm:px-3.5 ${
                socialTab === channel.tab ? channel.tabActiveClass : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              <span>{channel.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        {isShown("LINKEDIN") && (
          <ChannelPanel
            {...forChannel("LINKEDIN")}
            value={edited.linkedin || linkedinCarousel?.caption || activeAsset.variants.linkedin || ""}
            identity={
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0077B5]/15 text-xs font-bold text-[#0077B5] shrink-0">
                  in
                </span>
                <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-ink truncate">{author?.name ?? "Parvej Shah"}</span>
                  {author?.role && <span className="text-xs text-muted truncate">· {author.role}</span>}
                </div>
              </div>
            }
            extras={
              <>
                <ChannelMediaPreview
                  channelLabel="LinkedIn"
                  isCarousel={isCarouselActive}
                  pages={carouselDeck}
                  heroImageUrl={heroImage}
                  title={activeAsset.title}
                />

                {/* First Comment Link Anchor */}
                {blogEnabled && activeAsset.doc_url && (
                  <div className="bg-brand/5 border border-brand/20 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand flex items-center gap-1.5">
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
          />
        )}

        {isShown("FACEBOOK") && (
          <ChannelPanel
            {...forChannel("FACEBOOK")}
            identity={
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1877F2]/15 text-xs font-bold text-[#1877F2] shrink-0">
                  f
                </span>
                <span className="text-sm font-semibold text-ink truncate">{author?.name ?? "Parvej Shah"}</span>
              </div>
            }
            extras={
              <>
                <ChannelMediaPreview
                  channelLabel="Facebook"
                  isCarousel={isCarouselActive}
                  pages={carouselDeck}
                  heroImageUrl={heroImage}
                  title={activeAsset.title}
                />

                {activeAsset.doc_url && (
                  <div className="bg-[#1877F2]/5 border border-[#1877F2]/20 rounded-xl p-3.5 space-y-1.5">
                    <span className="text-xs font-semibold text-[#1877F2] block">
                      First Comment (Pinned Link)
                    </span>
                    <p className="text-xs font-mono text-muted break-all">
                      {linkComment(activeAsset.doc_url)}
                    </p>
                  </div>
                )}
              </>
            }
          />
        )}

        {isShown("INSTAGRAM") && (
          <ChannelPanel
            {...forChannel("INSTAGRAM")}
            identity={
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C13584]/15 text-xs font-bold text-[#C13584] shrink-0">
                  ig
                </span>
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-ink truncate">{author?.name ?? "Parvej Shah"}</span>
                  <span className="block text-[11px] text-muted">
                    {carouselDeck ? `Post these ${carouselDeck.length} pages as one Instagram carousel.` : "Copy the caption and post it with the cover image."}
                  </span>
                </div>
              </div>
            }
            extras={
              <ChannelMediaPreview
                channelLabel="Instagram"
                isCarousel={isCarouselActive}
                pages={carouselDeck}
                heroImageUrl={heroImage}
                title={activeAsset.title}
                onSavePages={onSavePages}
                savingPages={savingPages}
              />
            }
          />
        )}

        {isShown("TWITTER") && (
          <ChannelPanel
            {...forChannel("TWITTER")}
            identity={
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 border border-line text-xs font-bold text-ink shrink-0">
                  𝕏
                </span>
                <span className="text-sm font-semibold text-ink truncate">{author?.name ?? "Editorial Author"}</span>
              </div>
            }
          />
        )}
      </div>
    </section>
  );
}
