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
  CheckCircle2,
  Search,
  ArrowUpRight,
  EyeOff,
  RotateCcw,
  Edit3,
  type LucideIcon,
} from "lucide-react";
import { PublishedPostRecord } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiResource } from "@/hooks/useApiResource";
import { useToast } from "@/hooks/useToast";
import { useChannelSummary } from "@/hooks/useChannelSummary";

import { apiClient, toErrorMessage } from "@/lib/api-client";
import { buttonStyles } from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/utils/date";
export const dynamic = "force-dynamic";

type TabPlatform = "BLOG" | "LINKEDIN" | "FACEBOOK" | "TWITTER";

const FILTER_THRESHOLD = 6;
const CHANNEL_NAME: Record<TabPlatform, string> = { BLOG: "blog", LINKEDIN: "LinkedIn", FACEBOOK: "Facebook", TWITTER: "X" };

/** Where a post can be read on the channel being viewed, if it was recorded. */
function liveLink(post: PublishedPostRecord, tab: TabPlatform): string | null {
  if (tab === "BLOG") return post.published_url || null;
  if (tab === "LINKEDIN") return post.channel_urls.linkedin;
  if (tab === "FACEBOOK") return post.channel_urls.facebook;
  return post.channel_urls.twitter;
}

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
  const { message: toastMessage, show: showToast } = useToast(4000);

  // Unpublish Modal State
  const [unpublishTarget, setUnpublishTarget] = useState<{ id: string; title: string } | null>(null);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const handleUnpublish = async () => {
    if (!unpublishTarget) return;
    setIsUnpublishing(true);
    try {
      await apiClient.delete(`/api/assets/${unpublishTarget.id}?mode=unpublish`);
      setFeed(prev => prev.filter(p => p.asset_id !== unpublishTarget.id));
      showToast(`Post "${unpublishTarget.title}" unpublished and returned to review queue.`);
      window.dispatchEvent(new Event("minions-counts-updated"));
    } catch (e) {
      showToast(toErrorMessage(e, "Could not unpublish that post."));
    } finally {
      setIsUnpublishing(false);
      setUnpublishTarget(null);
    }
  };

  const filteredPosts = feed.filter(post => {
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
    setDateFilter("ALL");
    setSearchQuery("");
  };

  /** Channel counts are the posts that carry copy for that channel; a draft with no LinkedIn variant is not a LinkedIn post. */
  const linkedinReady = feed.filter((p) => (p.variants?.linkedin || "").trim().length > 0).length;
  const facebookReady = feed.filter((p) => (p.variants?.facebook || "").trim().length > 0).length;
  const twitterReady = feed.filter((p) => (p.variants?.twitter || "").trim().length > 0).length;
  // Filters earn their space only once the list is long enough to search.
  const showFilters = feed.length >= FILTER_THRESHOLD;
  const latest = feed[0]?.published_at;

  const allTabs: { id: TabPlatform; label: string; count: number; icon: LucideIcon; color: string }[] = [
    { id: "BLOG", label: "Blog Articles", count: feed.length, icon: Globe, color: "#00C9A7" },
    { id: "LINKEDIN", label: "LinkedIn Posts", count: linkedinReady, icon: Share2, color: "#3B82F6" },
    { id: "FACEBOOK", label: "Facebook Posts", count: facebookReady, icon: Share2, color: "#8B5CF6" },
    { id: "TWITTER", label: "X / Twitter Posts", count: twitterReady, icon: Share2, color: "#0EA5E9" },
  ];
  const tabs = allTabs.filter((tab) => tabEnabled[tab.id]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-brand text-canvas px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-brand uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Published library
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Your published posts
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Everything Minions has posted for you, newest first.
          </p>
          <div className="mt-2 text-xs font-semibold text-ink">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : feed.length > 0 ? (
              `${feed.length} post${feed.length === 1 ? "" : "s"} published · last on ${formatDate(latest)}`
            ) : null}
          </div>
        </div>

        {tabEnabled.BLOG && (
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <a
              href={pageBlogOrigin ? `${pageBlogOrigin}/blog` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ size: "sm" })}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Live Blog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Channel Switcher Tabs: only when more than one channel is on */}
      {tabs.length > 1 && <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                isActive
                  ? "bg-surface-3 text-ink border border-line shadow-sm ring-1 ring-brand/40"
                  : "bg-transparent text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : undefined }} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? "bg-brand/20 text-brand" : "bg-surface-2 text-subtle"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>}

      {/* Filter Bar */}
      {showFilters && <div className="p-3 rounded-2xl bg-surface border border-line space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your posts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-2 border border-line rounded-xl pl-9 pr-4 py-2 text-xs text-ink focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-subtle shrink-0">Date:</span>
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
                      ? "bg-surface-3 text-brand border border-brand/40 font-bold"
                      : "text-subtle hover:text-muted"
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>}

      {/* Dynamic Content by Tab */}
      {isLoading ? (
        <LoadingState label="Loading published posts…" />
      ) : feed.length === 0 ? (
        <EmptyState
          title={error ? "Could not load the feed" : "No published posts yet"}
          description={error ?? "Approved drafts appear here once they go live."}
        />
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-line text-subtle flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-ink">No posts match your filters</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try a different search or date.
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line text-xs font-semibold text-brand transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPosts.map((post) => {
          return (
              <div
                key={post.id}
                className="rounded-2xl bg-surface border border-line hover:border-brand/50 transition-all p-4 flex flex-col justify-between space-y-4 shadow-sm group"
              >
                <div className="space-y-3.5">
                  {/* Platform pill */}
                  <div className="flex items-center">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      activeTab === "BLOG"
                        ? "bg-brand/10 text-brand border border-brand/30"
                        : activeTab === "LINKEDIN"
                          ? "bg-brand/10 text-brand border border-brand/30"
                          : activeTab === "FACEBOOK"
                            ? "bg-brand/10 text-brand border border-brand/30"
                            : "bg-brand/10 text-brand border border-brand/30"
                    }`}>
                      {activeTab === "BLOG" && "🌐 Live Blog"}
                      {activeTab === "LINKEDIN" && "💼 LinkedIn"}
                      {activeTab === "FACEBOOK" && "👥 Facebook"}
                      {activeTab === "TWITTER" && "🐦 X / Twitter"}
                    </span>
                  </div>

                  {/* 16:9 Thumbnail Image */}
                  {post.hero_image_url && (
                    <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-black border border-line/60 shadow-inner">
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

                  {/* Post title */}
                  <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                    {post.title}
                  </h3>
                </div>

                {/* Card Footer Actions */}
                <div className="space-y-3 pt-3 border-t border-line">
                  <p className="flex items-center gap-1 text-[11px] font-mono text-subtle">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{formatDateTime(post.published_at)}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {liveLink(post, activeTab) && (
                      <a
                        href={liveLink(post, activeTab) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonStyles({ size: "sm", className: "flex-1" })}
                      >
                        <span>View on {CHANNEL_NAME[activeTab]}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {post.asset_id ? (
                      <Link
                        href={`/editorial?id=${post.asset_id}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                        title="Edit in Editorial Studio"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Open in Studio</span>
                      </Link>
                    ) : (
                      <span
                        className="text-subtle flex items-center gap-1 text-[11px]"
                        title="This blog post has no matching draft, so it cannot be opened in the Studio"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>No draft</span>
                      </span>
                    )}
                  </div>

                  {activeTab === "BLOG" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => post.asset_id && setUnpublishTarget({ id: post.asset_id, title: post.title })}
                        disabled={!post.asset_id}
                        title={post.asset_id ? "Take down post from live blog and return to review queue" : "No matching asset — this post cannot be unpublished from the cockpit"}
                        className="flex items-center gap-1 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>Unpublish</span>
                      </button>
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
        title="Unpublish this post?"
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
