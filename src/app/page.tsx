"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Share2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Bot,
  Layers,
  ArrowUpRight,
  AlertCircle,
  ChevronRight,
  Globe,
  Radio
} from "lucide-react";
import { fetchIdeas, fetchAssets, fetchAgentFleet } from "@/lib/api";
import { AssetItem, IdeaItem, AgentWorkerItem } from "@/lib/types";

export default function MissionControlPage() {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [fleet, setFleet] = useState<AgentWorkerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [ideasData, assetsData, fleetData] = await Promise.all([
        fetchIdeas(),
        fetchAssets(),
        fetchAgentFleet()
      ]);
      setIdeas(ideasData);
      setAssets(assetsData);
      setFleet(fleetData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const pendingReviewAssets = assets.filter((a) => a.status === "PENDING_REVIEW");
  const publishedAssets = assets.filter((a) => a.status === "PUBLISHED");
  const draftingIdeas = ideas.filter((i) => i.status === "CLAIMED" || i.status === "DRAFTING" || i.status === "PICKED");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const ideasToday = ideas.filter((i) => new Date(i.created_at).getTime() >= startOfToday.getTime());

  const assetsWithCost = assets.filter((a) => typeof a.generation_cost === "number");
  const avgUnitCost = assetsWithCost.length > 0
    ? assetsWithCost.reduce((sum, a) => sum + (a.generation_cost || 0), 0) / assetsWithCost.length
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HERO / WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Autonomous Marketing & Operations Cockpit
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Mission Control
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Real-time multi-agent orchestration, editorial staging, and omnichannel broadcast telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <Link
            href="/ideas"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-xs font-semibold text-[#F1F5F9] px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00C9A7]" />
            <span>Discover Ideas</span>
          </Link>

          <Link
            href="/editorial"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/20 transition-all active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Editorial Studio ({pendingReviewAssets.length})</span>
          </Link>
        </div>
      </div>

      {/* TOP STAT TILES ROW (4 KPI TILES PER PRD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>HARVESTED IDEAS</span>
            <Sparkles className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            <span>{ideas.length}</span>
            <span className="text-xs font-normal text-[#00C9A7] font-mono">+{ideasToday.length} today</span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            Google Trends & Trade Forum Signals
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#ff6b4a]/30 space-y-2 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff6b4a]/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-mono text-[#ff6b4a]">
            <span>PENDING REVIEW</span>
            <span className="w-2 h-2 rounded-full bg-[#ff6b4a] animate-ping" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            <span>{pendingReviewAssets.length}</span>
            {pendingReviewAssets.length > 0 && (
              <span className="text-xs font-semibold text-[#ff6b4a] bg-[#ff6b4a]/10 px-2 py-0.5 rounded">Action Required</span>
            )}
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Staged & verified by Critic agent
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>PUBLISHED POSTS</span>
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            <span>{publishedAssets.length}</span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            Blog • Facebook live
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>AVG UNIT COST</span>
            <DollarSign className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            <span>{avgUnitCost !== null ? `$${avgUnitCost.toFixed(3)}` : "—"}</span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            Qwen3.7-max + Image3.0 tokens
          </div>
        </div>
      </div>

      {/* HORIZONTAL PIPELINE FLOW BAR (PER PRD SPECIFICATION) */}
      <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
          <span className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#00C9A7]" />
            PIPELINE FLOW STATUS
          </span>
          <span>Automated n8n Loop</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <Link href="/ideas" className="p-3 rounded-xl bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] transition-all group">
            <div className="text-xs font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] flex items-center justify-center gap-1.5">
              <span>✨ Ingested</span>
            </div>
            <div className="text-lg font-bold text-[#00C9A7] font-mono mt-1">{ideas.length}</div>
          </Link>

          <Link href="/ideas" className="p-3 rounded-xl bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] transition-all group">
            <div className="text-xs font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] flex items-center justify-center gap-1.5">
              <span>✍️ Drafting</span>
            </div>
            <div className="text-lg font-bold text-[#64748B] font-mono mt-1">{draftingIdeas.length}</div>
          </Link>

          <Link href="/editorial" className="p-3 rounded-xl bg-[#161D26] hover:bg-[#1E2733] border border-[#ff6b4a]/40 transition-all group shadow-sm">
            <div className="text-xs font-bold text-[#ff6b4a] flex items-center justify-center gap-1.5">
              <span>🔍 Review</span>
            </div>
            <div className="text-lg font-bold text-[#ff6b4a] font-mono mt-1">{pendingReviewAssets.length}</div>
          </Link>

          <Link href="/published" className="p-3 rounded-xl bg-[#161D26] hover:bg-[#1E2733] border border-[#00C9A7]/40 transition-all group shadow-sm">
            <div className="text-xs font-bold text-[#00C9A7] flex items-center justify-center gap-1.5">
              <span>✅ Published</span>
            </div>
            <div className="text-lg font-bold text-[#00C9A7] font-mono mt-1">{publishedAssets.length}</div>
          </Link>
        </div>
      </div>

      {/* MAIN FULL-WIDTH COCKPIT SECTIONS */}
      <div className="space-y-8">
        {/* PENDING REVIEW QUEUE */}
        <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff6b4a]" />
                Pending Editorial Review Queue
              </h2>
              <p className="text-xs text-[#94A3B8]">Review claims, adjust social variants, and broadcast to live channels.</p>
            </div>
            <span className="text-xs font-mono text-[#ff6b4a] font-bold bg-[#ff6b4a]/10 px-2 py-0.5 rounded border border-[#ff6b4a]/20">
              {pendingReviewAssets.length} Draft{pendingReviewAssets.length === 1 ? "" : "s"} Waiting
            </span>
          </div>

          {pendingReviewAssets.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#161D26] border border-dashed border-[#1F2D3D] text-[#00C9A7]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#00C9A7]" />
              <p className="text-sm font-bold">All clear — no drafts waiting for review</p>
              <p className="text-xs text-[#94A3B8] mt-1">Autonomous harvester is gathering fresh topics.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] hover:border-[#00C9A7]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* 48x48 Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-[#0F1419] border border-[#1F2D3D] shrink-0 overflow-hidden flex items-center justify-center">
                      {asset.hero_image_url ? (
                        <img 
                          src={asset.hero_image_url} 
                          alt={asset.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0e5c63]/20 text-[#00C9A7] font-mono text-sm font-bold">
                          {(asset.title || "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#ff6b4a]/10 text-[#ff6b4a] border border-[#ff6b4a]/20">
                          PENDING REVIEW
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          asset.audience === "ICP" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                        }`}>
                          {asset.audience}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#F1F5F9] truncate group-hover:text-[#00C9A7] transition-colors">
                        {asset.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] line-clamp-1">
                        {asset.hook || asset.body_content?.slice(0, 100)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                    <Link
                      href="/editorial"
                      className="px-4 py-2 rounded-xl bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold transition-all shadow-md shadow-[#00C9A7]/10 flex items-center gap-1.5"
                    >
                      <span>Review in Studio</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LIVE OMNICHANNEL BROADCASTS */}
        <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00C9A7]" />
                Live Omnichannel Broadcasts
              </h2>
              <p className="text-xs text-[#94A3B8]">Verified post permalinks across live distribution channels</p>
            </div>
            <Link
              href="/published"
              className="text-xs font-mono text-[#00C9A7] hover:underline flex items-center gap-1"
            >
              <span>View All 18 Broadcasts →</span>
            </Link>
          </div>

          <div className="space-y-3">
            {publishedAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00C9A7]"></span>
                    <span className="text-xs font-bold text-[#F1F5F9]">{asset.title}</span>
                    <span className="text-[10px] font-mono text-[#64748B]">({asset.audience})</span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] flex items-center gap-3 font-mono">
                    <span>Published {new Date(asset.published_at || asset.updated_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-[#00C9A7]">3 Omnichannel Channels</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={asset.blog_url || `https://getminions.ai/blog/${asset.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-xs font-medium text-[#F1F5F9] hover:bg-[#1E2733] flex items-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3 h-3 text-[#00C9A7]" />
                    <span>Blog ↗</span>
                  </a>
                  <a
                    href="https://linkedin.com/company/getminionsai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-xs font-medium text-[#94A3B8] hover:text-[#0077b5] hover:bg-[#1E2733] flex items-center gap-1 transition-colors"
                  >
                    <span>LinkedIn ↗</span>
                  </a>
                  <a
                    href="https://facebook.com/getminionsai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-xs font-medium text-[#94A3B8] hover:text-[#1877f2] hover:bg-[#1E2733] flex items-center gap-1 transition-colors"
                  >
                    <span>Facebook ↗</span>
                  </a>
                  <a
                    href="https://twitter.com/getminionsai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-xs font-medium text-[#94A3B8] hover:text-[#38bdf8] hover:bg-[#1E2733] flex items-center gap-1 transition-colors"
                  >
                    <span>Twitter ↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
