"use client";

import { useCallback, useState } from "react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { normalizeDomain } from "@/constants/config";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  Share2,
  ExternalLink,
  Clock,
  DollarSign,
  Layers,
  CheckCircle2,
  Search,
  ArrowUpRight,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  type LucideIcon,
} from "lucide-react";
import { PublishedPostRecord } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import { useApiResource } from "@/hooks/useApiResource";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { channelOf, type SocialChannel } from "@/lib/channels";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useToast } from "@/hooks/useToast";
import { useChannelSummary } from "@/hooks/useChannelSummary";

export const dynamic = "force-dynamic";

type TabPlatform = "BLOG" | "LINKEDIN" | "FACEBOOK" | "TWITTER";

export default function PublishedPostsPage() {
  // Every "live blog" affordance points at the tenant's own domain. These were
  // hardcoded to getminions.ai, so each tenant's page linked to and warned
  // about this company's blog instead of their own.
  const { brandSettings: pageBrand } = useBrandSettings();
  const pageBlogOrigin = normalizeDomain(pageBrand?.company_domain);
  const pageBlogHost = pageBlogOrigin
    ? `${pageBlogOrigin.replace(/^https?:\/\//, "")}/blog`
    : "your blog";
  const {
    data: feed,
    isLoading,
    error,
    setData: setFeed,
  } = useApiResource<PublishedPostRecord[]>("/api/published", [], {
    errorMessage: "Could not load the published feed",
  });
  const channels = useChannelSummary();
  const tabEnabled: Record<TabPlatform, boolean> = {
    BLOG: channels?.blog ?? true,
    LINKEDIN: channels?.linkedin ?? true,
    FACEBOOK: channels?.facebook ?? true,
    TWITTER: channels?.x ?? true,
  };
  const firstEnabledTab =
    (Object.keys(tabEnabled) as TabPlatform[]).find((t) => tabEnabled[t]) ?? "BLOG";

  const [rawActiveTab, setActiveTab] = useState<TabPlatform>("BLOG");
  // If the selected tab isn't a channel this tenant connected (e.g. defaulted
  // to Blog but only LinkedIn is on), fall back to the first one that is,
  // without needing an effect to rewrite the underlying state.
  const activeTab = tabEnabled[rawActiveTab] ? rawActiveTab : firstEnabledTab;
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  /**
   * The "now" the date filter is measured against, captured when the user picks
   * a range. Calling Date.now() during render is impure and would make the
   * result depend on when React happens to re-render.
   */
  const [filterNow, setFilterNow] = useState(0);

  const applyDateFilter = useCallback((value: string) => {
    setFilterNow(Date.now());
    setDateFilter(value);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const { copiedKey, copy: handleCopy } = useCopyToClipboard(2500);
  const { message: toastMessage, show: showToast } = useToast(4000);

  // Unpublish Modal State
  const [unpublishTarget, setUnpublishTarget] = useState<{ id: string; title: string } | null>(null);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const handleUnpublish = async () => {
    if (!unpublishTarget) return;
    setIsUnpublishing(true);
    try {
      const res = await fetch(`/api/assets/${unpublishTarget.id}?mode=unpublish`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeed(prev => prev.filter(p => p.asset_id !== unpublishTarget.id));
        showToast(`Post "${unpublishTarget.title}" unpublished and returned to review queue.`);
        window.dispatchEvent(new Event("minions-counts-updated"));
      }
    } catch (e) {
      console.error("Failed to unpublish:", e);
    } finally {
      setIsUnpublishing(false);
      setUnpublishTarget(null);
    }
  };

  /**
   * Recording that a social post went out.
   *
   * Nothing observes LinkedIn/Facebook/X on our behalf — the cockpit hands over
   * copy and a share link, and the operator posts by hand. So "posted" is only
   * true once someone pastes the permalink back, which is what this writes into
   * `assets.published_urls`.
   */
  const [markTarget, setMarkTarget] = useState<string | null>(null);
  const [markUrl, setMarkUrl] = useState("");
  const [isMarking, setIsMarking] = useState(false);

  const openMarkPosted = (postId: string) => {
    setMarkTarget(postId);
    setMarkUrl("");
  };

  const handleMarkPosted = async (post: PublishedPostRecord, channel: SocialChannel) => {
    const url = markUrl.trim();
    if (!post.asset_id || !url) return;
    if (channelOf(url) !== channel) {
      showToast(`That does not look like a ${channel} URL — nothing was saved.`);
      return;
    }

    setIsMarking(true);
    try {
      const existing = Object.values(post.channel_urls).filter(Boolean) as string[];
      const merged = [...existing.filter((u) => channelOf(u) !== channel), url];
      await apiClient.patch(`/api/assets/${post.asset_id}`, { published_urls: merged });

      setFeed((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, channel_urls: { ...p.channel_urls, [channel]: url } } : p
        )
      );
      showToast("Recorded — the post is now marked as live on that channel.");
      setMarkTarget(null);
      setMarkUrl("");
    } catch (e) {
      showToast(toErrorMessage(e, "Could not record the post URL"));
    } finally {
      setIsMarking(false);
    }
  };

  // Only posts with a recorded cost contribute; the rest are counted as
  // unknown rather than filled in with an assumed figure.
  const totalSpend = feed.reduce((acc, p) => acc + (p.cost_usd ?? 0), 0);
  const postsWithoutCost = feed.filter((p) => p.cost_usd === null).length;

  const filteredPosts = feed.filter(post => {
    if (audienceFilter !== "ALL" && post.audience !== audienceFilter) return false;

    if (dateFilter !== "ALL" && filterNow > 0) {
      const postDate = new Date(post.published_at).getTime();
      const now = filterNow;
      if (dateFilter === "TODAY") {
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        if (postDate < oneDayAgo) return false;
      } else if (dateFilter === "THIS_WEEK") {
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        if (postDate < oneWeekAgo) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const socialContent = activeTab === "LINKEDIN" ? (post.variants?.linkedin || "")
        : activeTab === "FACEBOOK" ? (post.variants?.facebook || "")
        : activeTab === "TWITTER" ? (post.variants?.twitter || "")
        : "";

      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        socialContent.toLowerCase().includes(q) ||
        (post.asset_id ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const resetFilters = () => {
    setAudienceFilter("ALL");
    setDateFilter("ALL");
    setSearchQuery("");
  };

  const formatPublishDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Channel counts are the posts that actually carry copy for that channel.
   *
   * Every tab used to show `feed.length`, which asserted that all four channels
   * had a post for every article — a draft with no LinkedIn variant still
   * counted towards "LinkedIn Posts".
   */
  const linkedinReady = feed.filter((p) => (p.variants?.linkedin || "").trim().length > 0).length;
  const facebookReady = feed.filter((p) => (p.variants?.facebook || "").trim().length > 0).length;
  const twitterReady = feed.filter((p) => (p.variants?.twitter || "").trim().length > 0).length;
  const channelCopyReady = feed.length + linkedinReady + facebookReady + twitterReady;
  /** Social posts with a recorded permalink — the only evidence one went out. */
  const socialPostsRecorded = feed.reduce(
    (acc, p) => acc + Object.values(p.channel_urls).filter(Boolean).length,
    0
  );

  const allTabs: { id: TabPlatform; label: string; count: number; icon: LucideIcon; color: string }[] = [
    { id: "BLOG", label: "Blog Articles", count: feed.length, icon: Globe, color: "#00C9A7" },
    { id: "LINKEDIN", label: "LinkedIn Posts", count: linkedinReady, icon: Share2, color: "#3B82F6" },
    { id: "FACEBOOK", label: "Facebook Posts", count: facebookReady, icon: Share2, color: "#8B5CF6" },
    { id: "TWITTER", label: "X / Twitter Posts", count: twitterReady, icon: Share2, color: "#0EA5E9" },
  ];
  const tabs = allTabs.filter((tab) => tabEnabled[tab.id]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#00C9A7] text-[#070B0F] px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Live Omnichannel Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Published Broadcasts & Channels
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Switch between channels to view live articles, copy ready-to-post social copy, and track production costs.
          </p>
        </div>

        {tabEnabled.BLOG && (
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <a
              href={pageBlogOrigin ? `${pageBlogOrigin}/blog` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/20 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Live Blog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1F2D3D] pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                isActive
                  ? "bg-[#1E2733] text-[#F1F5F9] border border-[#1F2D3D] shadow-sm ring-1 ring-[#00C9A7]/40"
                  : "bg-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
              }`}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : undefined }} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? "bg-[#00C9A7]/20 text-[#00C9A7]" : "bg-[#161D26] text-[#64748B]"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono text-[#94A3B8]">POSTS LIVE</div>
            <div className="text-xl font-bold text-[#F1F5F9] mt-0.5">{feed.length} Articles</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center text-[#00C9A7]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono text-[#94A3B8]">CHANNEL COPY READY</div>
            <div className="text-xl font-bold text-[#F1F5F9] mt-0.5">{channelCopyReady} Pieces</div>
            <div className="text-[10px] text-[#64748B] mt-0.5">
              Live articles plus the social variants that exist
            </div>
            <div className="text-[10px] text-[#64748B]">
              {socialPostsRecorded} social post{socialPostsRecorded === 1 ? "" : "s"} recorded as live
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono text-[#94A3B8]">TOTAL SPEND</div>
            <div className="text-xl font-bold text-[#F1F5F9] mt-0.5">${totalSpend.toFixed(3)}</div>
            {postsWithoutCost > 0 && (
              <div className="text-[10px] text-[#64748B] mt-0.5">
                {postsWithoutCost} post{postsWithoutCost === 1 ? "" : "s"} with no recorded cost excluded
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#ff6b4a]/10 border border-[#ff6b4a]/20 flex items-center justify-center text-[#ff6b4a]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "BLOG" ? "blog articles" : activeTab.toLowerCase() + " posts"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Audience Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#64748B] shrink-0">Audience:</span>
              {["ALL", "ICP", "PEER", "BRIDGE"].map((aud) => (
                <button
                  key={aud}
                  onClick={() => setAudienceFilter(aud)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    audienceFilter === aud
                      ? "bg-[#1E2733] text-[#00C9A7] border border-[#00C9A7]/40 font-bold"
                      : "text-[#64748B] hover:text-[#94A3B8]"
                  }`}
                >
                  {aud}
                </button>
              ))}
            </div>

            {/* Time Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#64748B] shrink-0">Date:</span>
              {[
                { label: "All Time", value: "ALL" },
                { label: "Today", value: "TODAY" },
                { label: "This Week", value: "THIS_WEEK" },
              ].map((df) => (
                <button
                  key={df.value}
                  onClick={() => applyDateFilter(df.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === df.value
                      ? "bg-[#1E2733] text-[#3B82F6] border border-[#3B82F6]/40 font-bold"
                      : "text-[#64748B] hover:text-[#94A3B8]"
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Content by Tab */}
      {isLoading ? (
        <LoadingState label="Loading published posts…" />
      ) : feed.length === 0 ? (
        <EmptyState
          title={error ? "Could not load the feed" : "No published posts yet"}
          description={error ?? "Approved drafts appear here once they go live."}
        />
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#161D26] border border-[#1F2D3D] text-[#64748B] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F1F5F9]">No broadcasts match your filters</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Try adjusting your search query or filters.
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-xs font-semibold text-[#00C9A7] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
            const socialCopy = activeTab === "LINKEDIN" ? (post.variants?.linkedin || "")
              : activeTab === "FACEBOOK" ? (post.variants?.facebook || "")
              : activeTab === "TWITTER" ? (post.variants?.twitter || "")
              : "";

            /**
             * Which channel this card represents, and whether a permalink for
             * it has ever been recorded. Null channel = the blog tab.
             */
            const channel: SocialChannel | null =
              activeTab === "LINKEDIN"
                ? "linkedin"
                : activeTab === "FACEBOOK"
                  ? "facebook"
                  : activeTab === "TWITTER"
                    ? "twitter"
                    : null;
            const channelUrl = channel ? post.channel_urls[channel] : null;

            const shareUrl = activeTab === "TWITTER" 
              ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialCopy || post.title + " " + post.published_url)}`
              : activeTab === "LINKEDIN"
                ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.published_url)}`
                : activeTab === "FACEBOOK"
                  ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.published_url)}`
                  : post.published_url;

            return (
              <div
                key={post.id}
                className="rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/50 transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm group"
              >
                <div className="space-y-3.5">
                  {/* Card Header & Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        activeTab === "BLOG"
                          ? "bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30"
                          : activeTab === "LINKEDIN"
                            ? "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30"
                            : activeTab === "FACEBOOK"
                              ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30"
                              : "bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30"
                      }`}>
                        {activeTab === "BLOG" && "🌐 Live Blog"}
                        {activeTab === "LINKEDIN" && "💼 LinkedIn"}
                        {activeTab === "FACEBOOK" && "👥 Facebook"}
                        {activeTab === "TWITTER" && "🐦 X / Twitter"}
                      </span>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        post.audience === "ICP" 
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" 
                          : post.audience === "BRIDGE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                      }`}>
                        {post.audience}
                      </span>

                      {/* Posting status. Nothing watches the networks, so this
                          reflects a recorded permalink and nothing else. */}
                      {channel && (
                        channelUrl ? (
                          <a
                            href={channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="A permalink was recorded for this channel"
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30 flex items-center gap-1 hover:bg-[#00C9A7]/20 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
                            <span>Posted</span>
                          </a>
                        ) : (
                          <span
                            title="No permalink recorded — posting to this channel is manual, so the cockpit cannot confirm it went out"
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#64748B]/10 text-[#94A3B8] border border-[#64748B]/30 flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full border border-[#94A3B8]" />
                            <span>Not posted</span>
                          </span>
                        )
                      )}
                    </div>

                    <span
                      className="text-[10px] font-mono text-[#64748B] bg-[#161D26] px-2 py-0.5 rounded border border-[#1F2D3D]"
                      title={
                        post.cost_usd === null
                          ? "No asset backs this post, so no generation cost was recorded"
                          : "Recorded generation cost"
                      }
                    >
                      {post.cost_usd === null ? "—" : `$${post.cost_usd.toFixed(3)}`}
                    </span>
                  </div>

                  {/* 16:9 Thumbnail Image */}
                  {post.hero_image_url && (
                    <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-black border border-[#1F2D3D]/60 shadow-inner">
                      <Image
                        src={post.hero_image_url}
                        alt={post.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/social-covers/github/github_social_dark.png";
                        }}
                      />
                    </div>
                  )}

                  {/* Main Content Area */}
                  {activeTab === "BLOG" ? (
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-[#F1F5F9] leading-snug line-clamp-2 group-hover:text-[#00C9A7] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                        <span className="truncate text-[#F1F5F9] font-bold">{post.title}</span>
                        {socialCopy && (
                          <button
                            onClick={() => handleCopy(socialCopy, `${activeTab}-${post.id}`)}
                            className="text-[#00C9A7] hover:text-[#00E5BD] flex items-center gap-1 font-bold shrink-0 ml-2"
                          >
                            {copiedKey === `${activeTab}-${post.id}` ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Post</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="bg-[#070B0F] border border-[#1F2D3D] p-3 rounded-xl max-h-36 overflow-y-auto">
                        <p className="text-xs font-sans text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                          {socialCopy || "No social variant generated for this post."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="space-y-2 pt-3 border-t border-[#1F2D3D]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                    <span className="flex items-center gap-1 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{formatPublishDate(post.published_at)}</span>
                    </span>
                    {post.asset_id ? (
                      <Link
                        href={`/editorial?id=${post.asset_id}`}
                        className="text-[#94A3B8] hover:text-[#00C9A7] flex items-center gap-1 transition-colors text-[11px]"
                        title="Edit in Editorial Studio"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Studio</span>
                      </Link>
                    ) : (
                      <span
                        className="text-[#64748B] flex items-center gap-1 text-[11px]"
                        title="This blog post has no matching asset in the cockpit, so it cannot be opened in the Studio"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>No asset</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {activeTab === "BLOG" ? (
                      <>
                        <button
                          onClick={() =>
                            post.asset_id &&
                            setUnpublishTarget({ id: post.asset_id, title: post.title })
                          }
                          disabled={!post.asset_id}
                          title={
                            post.asset_id
                              ? "Take down post from live blog and return to review queue"
                              : "No matching asset — this post cannot be unpublished from the cockpit"
                          }
                          className="flex items-center gap-1 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Unpublish</span>
                        </button>

                        <a
                          href={post.published_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-[#00C9A7]/10 hover:bg-[#00C9A7] text-[#00C9A7] hover:text-[#070B0F] border border-[#00C9A7]/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          <span>View Live Article</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopy(socialCopy, `bottom-${activeTab}-${post.id}`)}
                          className="flex items-center gap-1 bg-[#161D26] hover:bg-[#1E2733] text-[#F1F5F9] border border-[#1F2D3D] text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          {copiedKey === `bottom-${activeTab}-${post.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-[#00C9A7]" />
                              <span className="text-[#00C9A7]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          {channel && channelUrl ? (
                            <a
                              href={channelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-[#00C9A7]/10 hover:bg-[#00C9A7] text-[#00C9A7] hover:text-[#070B0F] border border-[#00C9A7]/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                              <span>View Post</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            channel &&
                            post.asset_id && (
                              <button
                                onClick={() => openMarkPosted(post.id)}
                                title="Paste the permalink after posting, so the cockpit knows it went out"
                                className="flex items-center gap-1 bg-[#161D26] hover:bg-[#1E2733] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark posted</span>
                              </button>
                            )
                          )}

                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white border border-[#3B82F6]/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <span>{activeTab === "TWITTER" ? "Post on X" : activeTab === "LINKEDIN" ? "Share on LinkedIn" : "Share on Facebook"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Permalink capture, revealed by "Mark posted" */}
                  {channel && markTarget === post.id && (
                    <div className="pt-2 space-y-1.5">
                      <label className="text-[10px] font-mono text-[#64748B] block">
                        Paste the {activeTab === "TWITTER" ? "X" : activeTab.toLowerCase()} permalink
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          value={markUrl}
                          onChange={(e) => setMarkUrl(e.target.value)}
                          placeholder="https://…"
                          className="flex-1 min-w-0 bg-[#070B0F] border border-[#1F2D3D] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]/60"
                        />
                        <button
                          onClick={() => handleMarkPosted(post, channel)}
                          disabled={isMarking || markUrl.trim().length === 0}
                          className="shrink-0 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isMarking ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setMarkTarget(null)}
                          className="shrink-0 text-[11px] text-[#64748B] hover:text-[#F1F5F9] px-2 py-1.5 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unpublish Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(unpublishTarget)}
        title="Unpublish Broadcast"
        description={`Are you sure you want to unpublish "${unpublishTarget?.title}"? It will immediately be taken down from ${pageBlogHost} and returned to the review queue without deleting any content.`}
        confirmLabel="Unpublish Post"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isUnpublishing}
        onConfirm={handleUnpublish}
        onClose={() => setUnpublishTarget(null)}
      />
    </div>
  );
}
