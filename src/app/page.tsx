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
  ChevronRight
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
        fetchAgentFleet(),
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

  return (
    <div className="space-y-8">
      {/* HERO / WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#0e5c63] uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0e5c63]"></span>
            <span>Autonomous Marketing & Operations Cockpit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12242a]">
            Mission Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-agent orchestration, editorial staging, and omnichannel broadcast telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e5e7eb] hover:border-slate-300 text-xs font-semibold text-[#12242a] shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0e5c63]" />
            <span>Explore Idea Matrix</span>
          </Link>
          <Link
            href="/drafts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-xs font-semibold text-white shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-[#ff6b4a]" />
            <span>Review Pending Drafts ({pendingReviewAssets.length})</span>
          </Link>
        </div>
      </div>

      {/* METRIC TICKER CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ideas */}
        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase font-mono">Harvested Ideas</span>
            <div className="p-2 rounded-lg bg-teal-50 text-[#0e5c63]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#12242a]">{ideas.length}</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +4 this week
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sourced from Trends, Reddit, & HVAC trade signals</p>
        </div>

        {/* Card 2: Pending Reviews */}
        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase font-mono">Pending Review</span>
            <div className="p-2 rounded-lg bg-[#fff1ed] text-[#ff6b4a]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#12242a]">{pendingReviewAssets.length}</span>
            <span className="text-xs font-medium text-[#ff6b4a]">Action Required</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Staged in 5-stage Stripe/Linear editorial format</p>
        </div>

        {/* Card 3: Published Assets */}
        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase font-mono">Published Posts</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#12242a]">{publishedAssets.length}</span>
            <span className="text-xs font-medium text-emerald-600">100% Live</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Omnichannel on Blog, Facebook, and LinkedIn</p>
        </div>

        {/* Card 4: Average Cost per Post */}
        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase font-mono">Avg Cost / Post</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#12242a]">$0.038</span>
            <span className="text-xs font-medium text-slate-500 font-mono">~3.8¢ / asset</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Includes Qwen LLM tokens + 2K cover synthesis</p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN COCKPIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLS: PENDING REVIEWS & LIVE BROADCAST TRACKER */}
        <div className="lg:col-span-2 space-y-8">
          {/* PENDING EDITORIAL REVIEW SECTION */}
          <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b4a] animate-pulse"></div>
                <h2 className="text-base font-bold text-[#12242a]">Pending Review Queue</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[#fff1ed] text-[#ff6b4a] border border-[#ff6b4a]/20">
                  {pendingReviewAssets.length} Staged
                </span>
              </div>
              <Link
                href="/drafts"
                className="text-xs font-semibold text-[#0e5c63] hover:text-[#0a464c] flex items-center gap-1"
              >
                <span>Open Editorial Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#f3f4f6] mt-2">
              {pendingReviewAssets.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  🎉 No drafts currently waiting for review. All staged assets have been published!
                </div>
              ) : (
                pendingReviewAssets.map((asset) => (
                  <div key={asset.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-50 text-[#0e5c63] border border-teal-100">
                          {asset.audience}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{asset.pillar}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{asset.id}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#12242a] group-hover:text-[#0e5c63] transition-colors">
                        {asset.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {asset.hook || asset.core_argument}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/drafts/${asset.id}`}
                        className="px-3.5 py-2 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <span>Review & Publish</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* OMNICHANNEL LIVE BROADCAST TRACKER */}
          <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-[#0e5c63]" />
                <h2 className="text-base font-bold text-[#12242a]">Live Omnichannel Broadcasts</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Blog • LinkedIn • Facebook</span>
            </div>

            <div className="divide-y divide-[#f3f4f6] mt-2">
              {publishedAssets.map((asset) => (
                <div key={asset.id} className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#12242a]">{asset.title}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Published {new Date(asset.published_at || asset.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={`https://getminions.ai/blog/${asset.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-[#0e5c63] hover:bg-teal-100 text-xs font-semibold transition-colors"
                    >
                      <span>View Live Post</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Social Channel Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {asset.social_variants?.map((variant) => (
                      <a
                        key={variant.id}
                        href={variant.published_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#faf9f6] border border-[#e5e7eb] hover:border-slate-300 text-[11px] font-medium text-slate-600 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-[#12242a]">{variant.platform}:</span>
                        <span>View Link</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COL: AGENT FLEET TELEMETRY & LIVE EXECUTION LOG */}
        <div className="space-y-8">
          {/* FLEET STATUS PANEL */}
          <div className="p-6 rounded-2xl bg-[#12242a] text-white shadow-md border border-[#1f343d]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f343d]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#ff6b4a]" />
                <h2 className="text-sm font-bold tracking-tight">Active Agent Fleet</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● 7 Active
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {fleet.map((worker) => (
                <div
                  key={worker.id}
                  className="p-3 rounded-xl bg-[#1a313a] border border-[#2b4752] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{worker.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#12242a] text-teal-300">
                        {worker.model}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Last active: {new Date(worker.last_active_at || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT HARVESTED SIGNALS */}
          <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0e5c63]" />
                <h2 className="text-sm font-bold text-[#12242a]">Fresh Ideas Stream</h2>
              </div>
              <Link href="/ideas" className="text-xs font-semibold text-[#0e5c63] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {ideas.slice(0, 3).map((idea) => (
                <div key={idea.id} className="p-3 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-teal-50 text-[#0e5c63] font-semibold">
                      {idea.target_trade}
                    </span>
                    <span className="text-slate-400">{idea.source}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#12242a] line-clamp-2">{idea.raw_idea}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
