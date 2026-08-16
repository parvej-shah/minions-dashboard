"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  ShieldCheck, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Zap,
  Image as ImageIcon,
  Globe
} from "lucide-react";
import { fetchAssets } from "@/lib/api";
import { AssetItem, AssetStatus } from "@/lib/types";

const statusTabs: { label: string; value: "ALL" | AssetStatus }[] = [
  { label: "All Drafts", value: "ALL" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Drafting", value: "DRAFT" },
];

export default function DraftsListPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"ALL" | AssetStatus>("ALL");

  useEffect(() => {
    async function loadAssets() {
      const data = await fetchAssets();
      setAssets(data);
    }
    loadAssets();
  }, []);

  const filteredAssets = selectedTab === "ALL" 
    ? assets 
    : assets.filter(a => a.status === selectedTab);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#0e5c63] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0e5c63] animate-pulse" />
            Editorial Staging Studio
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12242a]">
            Drafts & Editorial Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, verify claims, adjust social variants, and 1-click broadcast without Google Docs or Sheets.
          </p>
        </div>

        <Link
          href="/ideas"
          className="flex items-center gap-2 bg-[#0e5c63] hover:bg-[#128a96] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Article from Idea</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTab === tab.value
                ? "bg-[#12242a] text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-[#12242a] hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drafts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white rounded-2xl border border-[#e5e7eb] hover:border-[#0e5c63] p-5 transition-all shadow-xs space-y-3 group"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    asset.status === "PUBLISHED" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : asset.status === "PENDING_REVIEW"
                        ? "bg-[#ff6b4a]/10 text-[#ff6b4a] border border-[#ff6b4a]/20"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                    {asset.status === "PUBLISHED" ? "● LIVE" : asset.status}
                  </span>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    asset.audience === "ICP" 
                      ? "bg-teal-50 text-teal-700" 
                      : "bg-blue-50 text-blue-700"
                  }`}>
                    {asset.audience}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">{asset.pillar}</span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-400 font-mono">v{asset.version}</span>
                </div>

                <h3 className="text-base font-bold text-[#12242a] group-hover:text-[#0e5c63] transition-colors">
                  {asset.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {asset.hook || asset.body_content.slice(0, 150)}
                </p>

                {/* Claims & Social summary */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Claims: {asset.claims_verified ? "Verified" : "Pending Check"}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{asset.social_variants?.length || 0} Social Variants Ready</span>
                  </div>

                  {asset.hero_image_url && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <ImageIcon className="w-3.5 h-3.5 text-[#ff6b4a]" />
                      <span>2K Cover Staged</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {asset.status === "PUBLISHED" && (
                  <a
                    href={asset.blog_url || `https://getminions.ai/blog/${asset.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0e5c63] text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>View Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <Link
                  href={`/drafts/${asset.id}`}
                  className="px-4 py-2 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>{asset.status === "PUBLISHED" ? "Edit / Rebroadcast" : "Review & Publish"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
