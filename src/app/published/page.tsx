"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Globe, 
  Share2, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  Filter, 
  Search,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  EyeOff,
  Trash2,
  Copy,
  Check,
  Calendar,
  RotateCcw,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PublishedPostRecord } from "@/lib/types";
import ConfirmModal from "@/components/common/ConfirmModal";

export const dynamic = "force-dynamic";

export default function PublishedPostsPage() {
  const [feed, setFeed] = useState<PublishedPostRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedSocialId, setExpandedSocialId] = useState<string | null>(null);

  // Unpublish Modal State
  const [unpublishTarget, setUnpublishTarget] = useState<{ id: string; title: string } | null>(null);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/published");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFeed(data);
        }
      }
    } catch (e) {
      console.error("Failed to load published feed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!unpublishTarget) return;
    setIsUnpublishing(true);
    try {
      const res = await fetch(`/api/assets/${unpublishTarget.id}?mode=unpublish`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeed(prev => prev.filter(p => p.asset_id !== unpublishTarget.id));
        setToastMessage(`Post "${unpublishTarget.title}" unpublished and returned to review queue.`);
        setTimeout(() => setToastMessage(null), 4000);
        window.dispatchEvent(new Event("minions-counts-updated"));
      }
    } catch (e) {
      console.error("Failed to unpublish:", e);
    } finally {
      setIsUnpublishing(false);
      setUnpublishTarget(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const totalSpend = feed.reduce((acc, p) => acc + (p.cost_usd || 0.038), 0);

  const filteredPosts = feed.filter(post => {
    if (audienceFilter !== "ALL" && post.audience !== audienceFilter) return false;

    if (dateFilter !== "ALL") {
      const postDate = new Date(post.published_at).getTime();
      const now = Date.now();
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
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.asset_id.toLowerCase().includes(q)
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
            Live Broadcast Feed
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Published Posts & Omnichannel Distribution
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Live verification hub for all published articles across the Blog, LinkedIn, Facebook, and Twitter with direct links and cost tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <a
            href="https://getminions.ai/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/20 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Live Blog</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Top 3 Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>TOTAL POSTS LIVE</span>
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            {feed.length} Articles Live
          </div>
          <div className="text-[11px] text-[#00C9A7] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            100% Delivery Success Rate
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>OMNICHANNEL CHANNELS</span>
            <Layers className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            {feed.length * 4} Broadcasts
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            4 Channels / Post (Blog • LinkedIn • Facebook • X)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>TOTAL PRODUCTION SPEND</span>
            <DollarSign className="w-4 h-4 text-[#ff6b4a]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            ${totalSpend.toFixed(4)}
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Avg ${ (totalSpend / (feed.length || 1)).toFixed(3) } / article (Tokens + 2K Cover)
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
              placeholder="Search published posts, excerpts, or IDs..."
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
                  onClick={() => setDateFilter(df.value)}
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

      {/* Broadcast Cards Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#161D26] border border-[#1F2D3D] text-[#64748B] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F1F5F9]">No published posts match your filters</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Try adjusting your search query or audience filters.
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
            const hasSocial = Boolean(post.variants?.linkedin || post.variants?.facebook || post.variants?.twitter);
            const isExpanded = expandedSocialId === post.id;

            return (
              <div
                key={post.id}
                className="rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/50 transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm group"
              >
                <div className="space-y-3.5">
                  {/* Top Badge & Metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30">
                        🌐 Live Blog
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
                    </div>

                    <span className="text-[10px] font-mono text-[#64748B] bg-[#161D26] px-2 py-0.5 rounded border border-[#1F2D3D]">
                      ${post.cost_usd.toFixed(3)}
                    </span>
                  </div>

                  {/* 16:9 Thumbnail Image */}
                  {post.hero_image_url && (
                    <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-black border border-[#1F2D3D]/60 shadow-inner">
                      <img
                        src={post.hero_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/social-covers/github/github_social_dark.png";
                        }}
                      />
                    </div>
                  )}

                  {/* Post Title & Excerpt */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-[#F1F5F9] leading-snug line-clamp-2 group-hover:text-[#00C9A7] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Omnichannel Social Channels Hub */}
                  {hasSocial && (
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => setExpandedSocialId(isExpanded ? null : post.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-[11px] font-mono text-[#94A3B8] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5 text-[#00C9A7]" />
                          <span>Omnichannel Social Copy</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 p-3 bg-[#070B0F] border border-[#1F2D3D] rounded-xl animate-in fade-in duration-150">
                          {post.variants?.linkedin && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-[#3B82F6]">
                                <span>LinkedIn Variant</span>
                                <button
                                  onClick={() => handleCopy(post.variants?.linkedin || "", `li-${post.id}`)}
                                  className="text-[#64748B] hover:text-[#3B82F6] flex items-center gap-1"
                                >
                                  {copiedKey === `li-${post.id}` ? <Check className="w-3 h-3 text-[#00C9A7]" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === `li-${post.id}` ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-[#94A3B8] line-clamp-2 font-mono bg-[#161D26] p-2 rounded-lg border border-[#1F2D3D]/50">
                                {post.variants.linkedin}
                              </p>
                            </div>
                          )}

                          {post.variants?.facebook && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-[#8B5CF6]">
                                <span>Facebook Variant</span>
                                <button
                                  onClick={() => handleCopy(post.variants?.facebook || "", `fb-${post.id}`)}
                                  className="text-[#64748B] hover:text-[#8B5CF6] flex items-center gap-1"
                                >
                                  {copiedKey === `fb-${post.id}` ? <Check className="w-3 h-3 text-[#00C9A7]" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === `fb-${post.id}` ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-[#94A3B8] line-clamp-2 font-mono bg-[#161D26] p-2 rounded-lg border border-[#1F2D3D]/50">
                                {post.variants.facebook}
                              </p>
                            </div>
                          )}

                          {post.variants?.twitter && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-[#1DA1F2]">
                                <span>X / Twitter Variant</span>
                                <button
                                  onClick={() => handleCopy(post.variants?.twitter || "", `tw-${post.id}`)}
                                  className="text-[#64748B] hover:text-[#1DA1F2] flex items-center gap-1"
                                >
                                  {copiedKey === `tw-${post.id}` ? <Check className="w-3 h-3 text-[#00C9A7]" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === `tw-${post.id}` ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-[#94A3B8] line-clamp-2 font-mono bg-[#161D26] p-2 rounded-lg border border-[#1F2D3D]/50">
                                {post.variants.twitter}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer with Live Link & Unpublish Action */}
                <div className="space-y-2 pt-3 border-t border-[#1F2D3D]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                    <span className="flex items-center gap-1 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{formatPublishDate(post.published_at)}</span>
                    </span>
                    <Link
                      href={`/editorial?id=${post.asset_id}`}
                      className="text-[#94A3B8] hover:text-[#00C9A7] flex items-center gap-1 transition-colors text-[11px]"
                      title="Edit in Editorial Studio"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Studio</span>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setUnpublishTarget({ id: post.asset_id, title: post.title })}
                      title="Take down post from live blog and return to review queue"
                      className="flex items-center gap-1 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
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
                      <span>View Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
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
        description={`Are you sure you want to unpublish "${unpublishTarget?.title}"? It will immediately be taken down from getminions.ai/blog and returned to the review queue without deleting any content.`}
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
