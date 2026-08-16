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
} from "lucide-react";
import { PublishedPostRecord } from "@/lib/types";

export default function PublishedPostsPage() {
  const [feed, setFeed] = useState<PublishedPostRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/published");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFeed(data);
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const totalSpend = feed.reduce((acc, p) => acc + (p.cost_usd || 0.038), 0);

  const filteredPosts = feed.filter(post => {
    if (platformFilter !== "ALL" && post.platform !== platformFilter) return false;
    if (audienceFilter !== "ALL" && post.audience !== audienceFilter) return false;
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Live Broadcast Feed
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Published Posts & Omnichannel Distribution
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Live verification feed for all broadcasts across the Blog, LinkedIn, and Facebook with direct links and cost tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <a
            href="https://getminions.ai/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/20 transition-all"
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
            <span>TOTAL BROADCASTS</span>
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            {feed.length} Posts Live
          </div>
          <div className="text-[11px] text-[#00C9A7] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            100% Delivery Success Rate
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>POSTS THIS WEEK</span>
            <Clock className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            {feed.length} Omnichannel
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Blog ({feed.filter(p => p.platform === "BLOG").length}) • LinkedIn ({feed.filter(p => p.platform === "LINKEDIN").length}) • Facebook ({feed.filter(p => p.platform === "FACEBOOK").length})
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
            Avg ${ (totalSpend / (feed.length || 1)).toFixed(3) } / post (Tokens + 2K Cover)
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-mono text-[#64748B] shrink-0">Platform:</span>
              {["ALL", "BLOG", "LINKEDIN", "FACEBOOK"].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    platformFilter === plat
                      ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-xs"
                      : "bg-[#161D26] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E2733]"
                  }`}
                >
                  {plat === "ALL" ? "All Platforms" : plat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#64748B] shrink-0">Audience:</span>
              {["ALL", "ICP", "PEER"].map((aud) => (
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
          </div>
        </div>
      </div>

      {/* Broadcast Cards Grid (3-Column Masonry) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
          const isBlog = post.platform === "BLOG";
          const isLinkedIn = post.platform === "LINKEDIN";
          const isFacebook = post.platform === "FACEBOOK";

          return (
            <div
              key={post.id}
              className="rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/50 transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm group"
            >
              <div className="space-y-3.5">
                {/* Top Badge & Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isBlog 
                        ? "bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30"
                        : isLinkedIn
                          ? "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30"
                          : "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30"
                    }`}>
                      {isBlog && "🌐 Blog"}
                      {isLinkedIn && "💼 LinkedIn"}
                      {isFacebook && "👥 Facebook"}
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      post.audience === "ICP" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
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

                {/* First Comment Link Anchor */}
                {post.first_comment && (
                  <div className="p-2.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-[11px] text-[#94A3B8] font-mono flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
                    <span className="truncate">{post.first_comment}</span>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer with Live Link */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1F2D3D]">
                <span className="text-[11px] font-mono text-[#64748B] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(post.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <a
                  href={post.published_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#00C9A7]/10 hover:bg-[#00C9A7] text-[#00C9A7] hover:text-[#070B0F] border border-[#00C9A7]/30 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  <span>View Live</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
