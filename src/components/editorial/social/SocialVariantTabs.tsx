"use client";

import React from "react";
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
import type { AssetItem } from "@/types";

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
}

/**
 * Platform-accurate previews and editors for the three social variants.
 *
 * The per-platform lookups this used to do against `activeAsset.social_variants`
 * always resolved to undefined — the API returns the bodies under `variants` —
 * so the cards silently showed placeholder copy. They read the real fields now.
 */
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
}: SocialVariantTabsProps) {
  return (
        <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D] pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#00C9A7]" />
              <span className="text-xs font-bold text-[#F1F5F9] font-mono uppercase tracking-wider">
                Social Media Staging & Realistic Mock Previews
              </span>
            </div>

            {/* Social Platform Tabs */}
            <div className="flex items-center gap-1.5 bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D]">
              <button
                onClick={() => setSocialTab("LINKEDIN")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  socialTab === "LINKEDIN"
                    ? "bg-[#0077B5] text-white shadow-md shadow-[#0077B5]/20"
                    : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                }`}
              >
                <span>LinkedIn Feed</span>
              </button>

              <button
                onClick={() => setSocialTab("FACEBOOK")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  socialTab === "FACEBOOK"
                    ? "bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/20"
                    : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                }`}
              >
                <span>Facebook Post</span>
              </button>

              <button
                onClick={() => setSocialTab("TWITTER")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  socialTab === "TWITTER"
                    ? "bg-[#1DA1F2] text-white shadow-md shadow-[#1DA1F2]/20"
                    : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                }`}
              >
                <span>X / Twitter</span>
              </button>
            </div>
          </div>

          {/* Realistic Platform Cards */}

          {/* TAB A: LINKEDIN REALISTIC FEED MOCK & EDITOR */}
          {socialTab === "LINKEDIN" && (
            <div className="bg-[#070B0F] rounded-xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 font-sans">
              {/* LinkedIn Author Header */}
              <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-3">
                <div className="flex items-start md:items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#00C9A7]/20 border border-[#00C9A7] flex items-center justify-center font-bold text-xs text-[#00C9A7] shrink-0">
                    M
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#F1F5F9] truncate">getminions.ai</span>
                      <span className="text-[#00C9A7] text-xs shrink-0 whitespace-nowrap">✓</span>
                      <span className="text-[10px] text-[#64748B] shrink-0 whitespace-nowrap">• 1st</span>
                    </div>
                    <div className="text-[11px] text-[#94A3B8] truncate">Autonomous AI Dispatch & Operations for US Home Services</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingSocial(!isEditingSocial)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingSocial ? "Preview Post" : "Edit Copy"}</span>
                  </button>

                  <button
                    onClick={() =>
                      onCopy(edited.linkedin || "", "social-linkedin")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#0077B5] border border-[#0077B5]/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {copiedKey === "social-linkedin" ? (
                      <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === "social-linkedin" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* LinkedIn Body Copy / Textarea */}
              {isEditingSocial ? (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={edited.linkedin}
                    onChange={(e) => setEditedLinkedin(e.target.value)}
                    placeholder="Edit LinkedIn post copy..."
                    className="w-full bg-[#0F1419] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl p-3 text-xs text-[#F1F5F9] leading-relaxed resize-y outline-none font-sans"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={onSave}
                      disabled={isSaving}
                      className="px-3 py-1 bg-[#00C9A7] text-[#070B0F] rounded-lg text-xs font-bold shadow-xs hover:bg-[#00A88A] transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save LinkedIn Copy</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#F1F5F9] leading-relaxed whitespace-pre-line bg-[#0F1419] p-4 rounded-xl border border-[#1F2D3D]/60 font-sans">
                  {edited.linkedin || (
                    <span className="text-[#64748B] italic">
                      No LinkedIn variant was generated for this draft yet.
                    </span>
                  )}
                </div>
              )}

              {/* First Comment Link Anchor */}
              {activeAsset.doc_url && (
                <div className="bg-[#00C9A7]/5 border border-[#00C9A7]/20 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#00C9A7] uppercase flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      First Comment (Link Anchor)
                    </span>
                    <button
                      onClick={() =>
                        onCopy(`Read the full deep dive: ${activeAsset.doc_url}`,
                          "first-comment-li"
                        )
                      }
                      className="text-[10px] font-mono text-[#00C9A7] hover:underline"
                    >
                      {copiedKey === "first-comment-li" ? "Copied!" : "Copy Anchor"}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[#94A3B8]">
                    {`Read the full deep dive: ${activeAsset.doc_url}`}
                  </p>
                </div>
              )}

              {/* LinkedIn Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1F2D3D] text-xs text-[#94A3B8]">
                <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Like</span>
                </div>
                <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Comment</span>
                </div>
                <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Repost</span>
                </div>
                <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB B: FACEBOOK REALISTIC POST MOCK & EDITOR */}
          {socialTab === "FACEBOOK" && (
            <div className="bg-[#070B0F] rounded-xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 font-sans">
              {/* Facebook Author Header */}
              <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-3">
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 border border-[#1877F2] flex items-center justify-center font-bold text-xs text-[#1877F2] shrink-0">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#F1F5F9]">getminions.ai</span>
                      <span className="text-[#1877F2] text-xs">●</span>
                    </div>
                    <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                      <span>2 hrs</span>
                      <span>•</span>
                      <Globe className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingSocial(!isEditingSocial)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingSocial ? "Preview Post" : "Edit Copy"}</span>
                  </button>

                  <button
                    onClick={() =>
                      onCopy(edited.facebook || "", "social-facebook")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border border-[#1877F2]/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {copiedKey === "social-facebook" ? (
                      <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === "social-facebook" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Facebook Body Copy / Textarea */}
              {isEditingSocial ? (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={edited.facebook}
                    onChange={(e) => setEditedFacebook(e.target.value)}
                    placeholder="Edit Facebook post copy..."
                    className="w-full bg-[#0F1419] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl p-3 text-xs text-[#F1F5F9] leading-relaxed resize-y outline-none font-sans"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={onSave}
                      disabled={isSaving}
                      className="px-3 py-1 bg-[#00C9A7] text-[#070B0F] rounded-lg text-xs font-bold shadow-xs hover:bg-[#00A88A] transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save Facebook Copy</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#F1F5F9] leading-relaxed whitespace-pre-line bg-[#0F1419] p-4 rounded-xl border border-[#1F2D3D]/60 font-sans">
                  {edited.facebook || (
                    <span className="text-[#64748B] italic">
                      No Facebook variant was generated for this draft yet.
                    </span>
                  )}
                </div>
              )}

              {/* First Comment Box */}
              {activeAsset.doc_url && (
                <div className="bg-[#1877F2]/5 border border-[#1877F2]/20 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#1877F2] uppercase block">
                    First Comment (Pinned Link)
                  </span>
                  <p className="text-xs font-mono text-[#94A3B8]">
                    {`Full teardown on our blog: ${activeAsset.doc_url}`}
                  </p>
                </div>
              )}

              {/* Facebook Action Bar */}
              <div className="flex items-center justify-around pt-2 border-t border-[#1F2D3D] text-xs text-[#94A3B8]">
                <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Like</span>
                </div>
                <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Comment</span>
                </div>
                <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB C: TWITTER / X REALISTIC THREAD MOCK & EDITOR */}
          {socialTab === "TWITTER" && (
            <div className="bg-[#070B0F] rounded-xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 font-sans">
              {/* Twitter Author Header */}
              <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-3">
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    𝕏
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#F1F5F9]">getminions.ai</span>
                      <span className="text-[11px] text-[#64748B]">@getminionsai</span>
                    </div>
                    <div className="text-[10px] text-[#64748B]">AI Dispatch Engine for Home Services</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingSocial(!isEditingSocial)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingSocial ? "Preview Post" : "Edit Copy"}</span>
                  </button>

                  <button
                    onClick={() =>
                      onCopy(edited.twitter || "", "social-twitter")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {copiedKey === "social-twitter" ? (
                      <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === "social-twitter" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Twitter Body Copy / Textarea */}
              {isEditingSocial ? (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    value={edited.twitter}
                    onChange={(e) => setEditedTwitter(e.target.value)}
                    placeholder="Edit X / Twitter post copy..."
                    className="w-full bg-[#0F1419] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl p-3 text-xs text-[#F1F5F9] leading-relaxed resize-y outline-none font-sans"
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono ${edited.twitter.length > 280 ? "text-[#EF4444]" : "text-[#64748B]"}`}>
                      {edited.twitter.length}/280 characters
                    </span>
                    <button
                      onClick={onSave}
                      disabled={isSaving}
                      className="px-3 py-1 bg-[#00C9A7] text-[#070B0F] rounded-lg text-xs font-bold shadow-xs hover:bg-[#00A88A] transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save Tweet</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#F1F5F9] leading-relaxed whitespace-pre-line bg-[#0F1419] p-4 rounded-xl border border-[#1F2D3D]/60 font-sans">
                  {edited.twitter || (
                    <span className="text-[#64748B] italic">
                      No X variant was generated for this draft yet.
                    </span>
                  )}
                </div>
              )}

              {/* Twitter action bar — icons only. This is an unposted draft, so
                  there are no engagement figures to show and none are invented. */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1F2D3D] text-xs text-[#64748B]">
                <MessageCircle className="w-3.5 h-3.5" />
                <Repeat className="w-3.5 h-3.5" />
                <ThumbsUp className="w-3.5 h-3.5" />
                <BarChart2 className="w-3.5 h-3.5" />
                <Bookmark className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
  );
}
